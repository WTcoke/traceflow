import { Injectable } from '@nestjs/common';
import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import {
  buriedPointSchema,
  buriedPointEventSchema,
  BuriedPointEventDto,
  CleanedBuriedPointData,
} from './dto/buried-point.dto';
import ajvFormats from 'ajv-formats';

/**
 * 验证错误接口
 * @property field - 错误字段名
 * @property message - 错误描述信息
 * @property value - 导致错误的字段值（可选）
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * 单条事件验证结果接口
 * @property index - 事件在批量中的索引位置
 * @property valid - 是否验证通过
 * @property errors - 验证错误列表
 * @property sanitizedEvent - 清洗后的事件数据
 */
export interface EventValidationResult {
  index: number;
  valid: boolean;
  errors: ValidationError[];
  sanitizedEvent: CleanedBuriedPointData;
}

/**
 * 批量验证结果接口
 * @property valid - 整体是否验证通过
 * @property appIdValid - appId是否有效
 * @property events - 每条事件的验证结果
 * @property totalErrors - 总错误数
 */
export interface BatchValidationResult {
  valid: boolean;
  appIdValid: boolean;
  events: EventValidationResult[];
  totalErrors: number;
}

/**
 * 数据验证服务
 * 负责验证和清洗埋点数据，确保数据格式正确、符合业务规则
 */
@Injectable()
export class DataValidatorService {
  /** 数据字段最大大小限制（1MB） */
  private readonly MAX_DATA_SIZE = 1024 * 1024;
  /** 有效的事件类型枚举 */
  private readonly VALID_EVENT_TYPES = ['behavior', 'performance', 'error'] as const;
  /** 默认事件类型 */
  private readonly DEFAULT_EVENT_TYPE = 'behavior';
  /** 默认平台标识 */
  private readonly DEFAULT_PLATFORM = 'other';

  /** AJV 验证器实例 */
  private readonly ajv: Ajv;
  /** 埋点数据整体验证器 */
  private readonly buriedPointValidator: ValidateFunction;
  /** 单条事件验证器 */
  private readonly eventValidator: ValidateFunction;

  /**
   * 构造函数 - 初始化 AJV 验证器
   * 配置：自动移除多余字段、应用默认值、类型强制转换、收集所有错误
   */
  constructor() {
    this.ajv = new Ajv({
      removeAdditional: true, // 移除 schema 中未定义的字段
      useDefaults: true, // 应用默认值
      coerceTypes: true, // 自动类型转换
      allErrors: true, // 收集所有错误（而非仅第一个）
      verbose: true, // 详细错误信息
    });
    ajvFormats(this.ajv); // 注册常用格式验证（如日期、邮箱等）

    // 编译验证 schema
    this.buriedPointValidator = this.ajv.compile(buriedPointSchema);
    this.eventValidator = this.ajv.compile(buriedPointEventSchema);
  }

  /**
   * 验证埋点数据整体 Schema 格式
   * @param data - 待验证的数据
   * @returns 验证结果，包含是否有效和错误列表
   */
  validateSchema(data: unknown): { valid: boolean; errors: ErrorObject[] | null } {
    const valid = this.buriedPointValidator(data);
    return {
      valid: !!valid,
      errors: this.buriedPointValidator.errors || null,
    };
  }

  /**
   * 批量验证埋点数据
   * @param data - 包含 appId 和 events 数组的对象
   * @returns 批量验证结果
   */
  validateBatch(data: { appId?: string; events?: unknown[] }): BatchValidationResult {
    const result: BatchValidationResult = {
      valid: true,
      appIdValid: true,
      events: [],
      totalErrors: 0,
    };

    // 验证数据基本格式
    if (!data || typeof data !== 'object') {
      result.valid = false;
      return result;
    }

    // 验证 appId
    const appId = data.appId;
    if (typeof appId !== 'string' || appId.trim().length === 0) {
      result.appIdValid = false;
      result.valid = false;
    }

    // 验证 events 是否为数组
    const events = data.events;
    if (!Array.isArray(events)) {
      result.valid = false;
      return result;
    }

    // 逐个验证事件
    for (let i = 0; i < events.length; i++) {
      const eventResult = this.validateSingleEvent(events[i], i);
      result.events.push(eventResult);
      if (!eventResult.valid) {
        result.totalErrors += eventResult.errors.length;
      }
    }

    // 确定整体验证结果
    if (!result.appIdValid || result.events.some((e) => !e.valid)) {
      result.valid = false;
    }

    return result;
  }

  /**
   * 验证单条事件数据
   * @param event - 待验证的事件数据
   * @param index - 事件在批量中的索引位置
   * @returns 单条事件验证结果
   */
  validateSingleEvent(event: unknown, index: number): EventValidationResult {
    const result: EventValidationResult = {
      index,
      valid: true,
      errors: [],
      sanitizedEvent: {} as CleanedBuriedPointData,
    };

    // 检查事件是否为空
    if (event === null || event === undefined) {
      result.valid = false;
      result.errors.push({
        field: 'event',
        message: 'Event object cannot be null or undefined',
      });
      return result;
    }

    // 深拷贝数据，避免修改原对象
    const clonedEvent = this.deepClone<Record<string, unknown>>(event as Record<string, unknown>);
    // 清洗事件数据
    this.sanitizeEventData(clonedEvent, result.errors);
    // 应用默认值
    this.applyDefaults(clonedEvent);

    // 使用 AJV 验证器进行 schema 验证
    const isValid = this.eventValidator(clonedEvent);
    if (!isValid && this.eventValidator.errors) {
      result.valid = false;
      for (const err of this.eventValidator.errors) {
        result.errors.push({
          field:
            err.instancePath.replace(/^\//, '') || String(err.params?.missingProperty || 'unknown'),
          message: err.message || 'Validation error',
          value: err.data,
        });
      }
    }
    // 根据错误列表判断是否有效
    result.valid = result.errors.length === 0;
    result.sanitizedEvent = clonedEvent as unknown as CleanedBuriedPointData;
    return result;
  }

  /**
   * 清洗事件数据（调用各字段清洗方法）
   * @param event - 待清洗的事件对象
   * @param errors - 错误收集数组
   */
  private sanitizeEventData(event: Record<string, unknown>, errors: ValidationError[]): void {
    this.sanitizeStringFields(event, errors); // 清洗字符串字段
    this.sanitizeDataField(event, errors); // 清洗 data 字段
    this.sanitizeTimestamp(event); // 清洗时间戳
    this.sanitizeEventType(event, errors); // 清洗事件类型
    this.sanitizePlatform(event); // 清洗平台字段
  }

  /**
   * 清洗字符串字段
   * - 去除首尾空格
   * - 超长字段截断并记录错误
   * - 空字符串（除 platform 外）设为 undefined
   * @param event - 事件对象
   * @param errors - 错误收集数组
   */
  private sanitizeStringFields(event: Record<string, unknown>, errors: ValidationError[]): void {
    // 定义各字符串字段的最大长度限制
    const stringFields: Array<{ key: keyof BuriedPointEventDto; maxLength: number }> = [
      { key: 'msgId', maxLength: 64 },
      { key: 'deviceId', maxLength: 128 },
      { key: 'userId', maxLength: 64 },
      { key: 'platform', maxLength: 32 },
      { key: 'userAgent', maxLength: 512 },
      { key: 'ip', maxLength: 45 },
      { key: 'os', maxLength: 50 },
      { key: 'browser', maxLength: 50 },
      { key: 'country', maxLength: 50 },
      { key: 'province', maxLength: 50 },
      { key: 'city', maxLength: 50 },
    ];

    for (const field of stringFields) {
      const value = event[field.key];
      if (value !== undefined && value !== null) {
        const stringValue = String(value).trim();
        // 超长处理
        if (stringValue.length > field.maxLength) {
          errors.push({
            field: field.key,
            message: `Exceeds maximum length of ${field.maxLength}, truncated`,
            value: stringValue.substring(0, 50) + '...',
          });
          event[field.key] = stringValue.substring(0, field.maxLength);
        } else if (stringValue.length === 0 && field.key !== 'platform') {
          // 空字符串处理（platform 允许为空，后续会设默认值）
          event[field.key] = undefined;
        } else {
          event[field.key] = stringValue;
        }
      }
    }
  }

  /**
   * 清洗 data 字段
   * - 空值处理：设为空对象
   * - 非对象类型：尝试 JSON 解析
   * - 大小限制：超过 1MB 重置为空对象
   * @param event - 事件对象
   * @param errors - 错误收集数组
   */
  private sanitizeDataField(event: Record<string, unknown>, errors: ValidationError[]): void {
    const dataField = event.data;

    // 空值处理
    if (dataField === undefined || dataField === null) {
      event.data = {};
      return;
    }

    // 非对象类型尝试 JSON 解析
    if (typeof dataField !== 'object') {
      try {
        event.data = JSON.parse(String(dataField));
      } catch {
        errors.push({
          field: 'data',
          message: 'Invalid JSON format, reset to empty object',
        });
        event.data = {};
      }
    }

    // 大小限制检查
    if (typeof event.data === 'object' && event.data !== null) {
      const dataString = JSON.stringify(event.data);
      if (dataString.length > this.MAX_DATA_SIZE) {
        errors.push({
          field: 'data',
          message: `Exceeds maximum size of ${this.MAX_DATA_SIZE} bytes, reset to empty object`,
        });
        event.data = {};
      }
    }
  }

  /**
   * 清洗时间戳字段
   * - 空值：设为当前时间
   * - 无效值（NaN/负数/超过未来1天）：设为当前时间
   * - 有效值：向下取整为整数
   * @param event - 事件对象
   */
  private sanitizeTimestamp(event: Record<string, unknown>): void {
    const eventTime = event.eventTime;
    // 空值处理
    if (eventTime === undefined) {
      event.eventTime = Date.now();
      return;
    }

    const timestamp = Number(eventTime);
    const now = Date.now();
    const maxFuture = now + 86400000; // 最大允许未来时间：当前时间 + 1天

    // 验证时间戳有效性
    if (isNaN(timestamp) || timestamp < 0 || timestamp > maxFuture) {
      event.eventTime = now;
    } else {
      event.eventTime = Math.floor(timestamp); // 向下取整
    }
  }

  /**
   * 清洗事件类型字段
   * - 有效值：behavior、performance、error
   * - 无效值：记录错误并设为默认值 behavior
   * @param event - 事件对象
   * @param errors - 错误收集数组
   */
  private sanitizeEventType(event: Record<string, unknown>, errors: ValidationError[]): void {
    const eventType = event.eventType;
    // 验证是否为有效事件类型
    if (
      typeof eventType === 'string' &&
      this.VALID_EVENT_TYPES.includes(eventType as 'behavior' | 'performance' | 'error')
    ) {
      return;
    }

    // 无效值处理
    if (eventType !== undefined && eventType !== null) {
      errors.push({
        field: 'eventType',
        message: `Invalid event type "${eventType}", defaulting to "${this.DEFAULT_EVENT_TYPE}"`,
        value: eventType,
      });
    }
    event.eventType = this.DEFAULT_EVENT_TYPE;
  }

  /**
   * 清洗平台字段
   * - 非空字符串：保持原值
   * - 其他：设为默认值 other
   * @param event - 事件对象
   */
  private sanitizePlatform(event: Record<string, unknown>): void {
    const platform = event.platform;
    if (typeof platform === 'string' && platform.trim().length > 0) {
      return;
    }
    event.platform = this.DEFAULT_PLATFORM;
  }

  /**
   * 为事件字段应用默认值
   * @param event - 事件对象
   */
  private applyDefaults(event: Record<string, unknown>): void {
    // 自动生成 msgId（格式：auto_时间戳_随机字符串）
    if (event.msgId === undefined || event.msgId === null) {
      event.msgId = `auto_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    // 默认设备ID
    if (event.deviceId === undefined || event.deviceId === null) {
      event.deviceId = 'unknown_device';
    }
    // 默认时间戳
    if (event.eventTime === undefined) {
      event.eventTime = Date.now();
    }
    // 默认事件类型
    if (event.eventType === undefined) {
      event.eventType = this.DEFAULT_EVENT_TYPE;
    }
    // 默认平台
    if (event.platform === undefined) {
      event.platform = this.DEFAULT_PLATFORM;
    }
    // 默认数据字段
    if (event.data === undefined) {
      event.data = {};
    }
  }

  /**
   * 深拷贝数据对象
   * 使用原生 structuredClone API 实现
   * @param data - 待拷贝的数据
   * @returns 拷贝后的新对象
   */
  private deepClone<T>(data: T): T {
    return structuredClone(data);
  }

  /**
   * 验证并清洗单个埋点数据（兼容旧版接口）
   * @param data 待验证的埋点数据
   * @returns 验证结果，包含清洗后的数据和错误信息
   */
  validateAndClean(data: CleanedBuriedPointData): {
    valid: boolean;
    errors: string[];
    cleanedData: CleanedBuriedPointData | null;
  } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        errors: ['Invalid data format'],
        cleanedData: null,
      };
    }

    // 使用 validateSingleEvent 进行验证
    const eventResult = this.validateSingleEvent(data, 0);

    if (!eventResult.valid) {
      errors.push(...eventResult.errors.map((err) => `${err.field}: ${err.message}`));
    }

    return {
      valid: errors.length === 0,
      errors,
      cleanedData: eventResult.sanitizedEvent,
    };
  }
}
