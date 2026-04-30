import { Test, TestingModule } from '@nestjs/testing';
import { DataValidatorService } from './data-validator.service';

describe('DataValidatorService', () => {
  let service: DataValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataValidatorService],
    }).compile();

    service = module.get<DataValidatorService>(DataValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAndClean', () => {
    it('should validate and clean valid data', () => {
      const validData = {
        msgId: 'msg_001',
        deviceId: 'device_abc',
        eventTime: Date.now(),
        eventType: 'behavior',
        platform: 'web',
        data: { page: '/home', action: 'click' },
      };

      const result = service.validateAndClean(validData);

      expect(result.valid).toBe(true);
      expect(result.cleanedData).toBeDefined();
      expect(result.cleanedData?.msgId).toBe('msg_001');
    });

    it('should reject data with missing required fields', () => {
      const invalidData = {
        // missing msgId
        deviceId: 'device_abc',
        eventTime: Date.now(),
        eventType: 'behavior',
        platform: 'web',
        data: {},
      };

      const result = service.validateAndClean(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should reject data with invalid eventType', () => {
      const invalidData = {
        msgId: 'msg_001',
        deviceId: 'device_abc',
        eventTime: Date.now(),
        eventType: 'invalid_type',
        platform: 'web',
        data: {},
      };

      const result = service.validateAndClean(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should clean string fields that exceed max length', () => {
      const longString = 'a'.repeat(2000);
      const data = {
        msgId: longString,
        deviceId: 'device_abc',
        eventTime: Date.now(),
        eventType: 'behavior',
        platform: 'web',
        data: {},
      };

      const result = service.validateAndClean(data);

      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should handle invalid data field', () => {
      const data = {
        msgId: 'msg_001',
        deviceId: 'device_abc',
        eventTime: Date.now(),
        eventType: 'behavior',
        platform: 'web',
        data: 'not a json object',
      };

      const result = service.validateAndClean(data);

      expect(result.valid).toBe(true);
      expect(result.cleanedData?.data).toEqual({});
    });

    it('should clean and validate timestamp', () => {
      const data = {
        msgId: 'msg_001',
        deviceId: 'device_abc',
        eventTime: 'invalid_timestamp',
        eventType: 'behavior',
        platform: 'web',
        data: {},
      };

      const result = service.validateAndClean(data);

      expect(result.valid).toBe(true);
      expect(typeof result.cleanedData?.eventTime).toBe('number');
    });

    it('should handle null and undefined values', () => {
      const data = {
        msgId: 'msg_001',
        deviceId: 'device_abc',
        userId: null,
        eventTime: Date.now(),
        eventType: 'behavior',
        platform: 'web',
        userAgent: undefined,
        ip: undefined,
        data: {},
      };

      const result = service.validateAndClean(data);

      expect(result.valid).toBe(true);
      expect(result.cleanedData?.userId).toBeNull();
      expect(result.cleanedData?.userAgent).toBeUndefined();
    });
  });
});
