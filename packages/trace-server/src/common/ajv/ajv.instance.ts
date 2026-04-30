import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// 创建全局唯一的 AJV 实例
export const ajv = new Ajv({
  strict: false, // 不严格模式，允许 schema 中的额外字段
  allErrors: true, // 返回所有错误，而不是一个
  coerceTypes: true, // 自动类型转换（string → number）
  useDefaults: true, // 使用默认值
  removeAdditional: true, // 删除 schema 外的多余字段（安全）
});

// 增加格式校验：date-time、email、uri 等
addFormats(ajv);
