import { Injectable } from '@nestjs/common';
import Ajv from 'ajv';
import { buriedPointSchema } from './dto/buried-point.dto';

const ajv = new Ajv({
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
});

ajv.addFormat(
  'ipv4',
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
);
ajv.addFormat('ipv6', /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/);

const validate = ajv.compile(buriedPointSchema);

export interface ValidateResult {
  valid: boolean;
  errors?: string[];
  cleanedData?: Record<string, any>;
}

export interface CleanedBuriedPointData {
  msgId: string;
  deviceId: string;
  userId?: string;
  eventTime: number;
  eventType: 'behavior' | 'performance' | 'error';
  platform: string;
  userAgent?: string;
  ip?: string;
  os?: string;
  browser?: string;
  country?: string;
  province?: string;
  city?: string;
  data: Record<string, any>;
}

@Injectable()
export class DataValidatorService {
  private readonly MAX_DATA_SIZE = 1024 * 1024;
  private readonly MAX_STRING_LENGTH = 1000;

  validateAndClean(data: Record<string, any>): ValidateResult {
    const errors: string[] = [];

    const clonedData = JSON.parse(JSON.stringify(data));

    this.cleanStringFields(clonedData, errors);
    this.cleanDataField(clonedData);
    this.validateTimestamp(clonedData);
    this.validateEventType(clonedData, errors);

    const isValid = validate(clonedData);

    if (!isValid && validate.errors) {
      validate.errors.forEach((err) => {
        errors.push(`${err.instancePath}: ${err.message}`);
      });
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: true,
      cleanedData: clonedData as CleanedBuriedPointData,
    };
  }

  private cleanStringFields(data: Record<string, any>, errors: string[]): void {
    const stringFields = [
      'msgId',
      'deviceId',
      'userId',
      'platform',
      'userAgent',
      'ip',
      'os',
      'browser',
      'country',
      'province',
      'city',
    ];

    for (const field of stringFields) {
      if (data[field] !== undefined && data[field] !== null) {
        data[field] = String(data[field]).trim();

        if (data[field].length > this.MAX_STRING_LENGTH) {
          errors.push(`${field} exceeds maximum length of ${this.MAX_STRING_LENGTH}`);
          data[field] = data[field].substring(0, this.MAX_STRING_LENGTH);
        }
      }
    }
  }

  private cleanDataField(data: Record<string, any>): void {
    if (data.data === undefined || data.data === null) {
      data.data = {};
      return;
    }

    if (typeof data.data !== 'object') {
      try {
        data.data = JSON.parse(String(data.data));
      } catch {
        data.data = {};
        return;
      }
    }

    const dataString = JSON.stringify(data.data);
    if (dataString.length > this.MAX_DATA_SIZE) {
      data.data = {};
    }
  }

  private validateTimestamp(data: Record<string, any>): void {
    if (data.eventTime !== undefined) {
      const eventTimeNum = Number(data.eventTime);
      if (isNaN(eventTimeNum) || eventTimeNum < 0 || eventTimeNum > Date.now() + 86400000) {
        data.eventTime = Date.now();
      }
    }
  }

  private validateEventType(data: Record<string, any>, errors: string[]): void {
    const validEventTypes: ('behavior' | 'performance' | 'error')[] = [
      'behavior',
      'performance',
      'error',
    ];
    if (data.eventType && !validEventTypes.includes(data.eventType as any)) {
      errors.push(`eventType must be one of: ${validEventTypes.join(', ')}`);
      data.eventType = 'behavior';
    }
  }
}
