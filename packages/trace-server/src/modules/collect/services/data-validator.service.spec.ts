import { Test, TestingModule } from '@nestjs/testing';
import { DataValidatorService } from '../services/data-validator.service';

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

  describe('validateBatch', () => {
    it('should validate and return valid result for correct BuriedPointDto', () => {
      const validData = {
        appId: 'app_001',
        events: [
          {
            msgId: 'msg_001',
            deviceId: 'device_abc',
            eventTime: Date.now(),
            eventType: 'behavior',
            platform: 'web',
            data: { page: '/home', action: 'click' },
          },
        ],
      };

      const result = service.validateBatch(validData);

      expect(result.valid).toBe(true);
      expect(result.appIdValid).toBe(true);
      expect(result.events.length).toBe(1);
      expect(result.events[0].valid).toBe(true);
      expect(result.events[0].sanitizedEvent.msgId).toBe('msg_001');
    });

    it('should reject data with invalid appId', () => {
      const invalidData = {
        appId: '',
        events: [
          {
            msgId: 'msg_001',
            deviceId: 'device_abc',
            eventTime: Date.now(),
            eventType: 'behavior',
            platform: 'web',
          },
        ],
      };

      const result = service.validateBatch(invalidData);

      expect(result.valid).toBe(false);
      expect(result.appIdValid).toBe(false);
    });

    it('should reject data with missing required event fields', () => {
      const invalidData = {
        appId: 'app_001',
        events: [
          {
            deviceId: 'device_abc',
            eventTime: Date.now(),
            eventType: 'behavior',
            platform: 'web',
          },
        ],
      };

      const result = service.validateBatch(invalidData);

      expect(result.valid).toBe(false);
      expect(result.events[0].valid).toBe(false);
      expect(result.events[0].errors.length).toBeGreaterThan(0);
    });

    it('should sanitize invalid eventType to default', () => {
      const data = {
        appId: 'app_001',
        events: [
          {
            msgId: 'msg_001',
            deviceId: 'device_abc',
            eventTime: Date.now(),
            eventType: 'invalid_type',
            platform: 'web',
          },
        ],
      };

      const result = service.validateBatch(data);

      expect(result.events[0].valid).toBe(false);
      expect(result.events[0].sanitizedEvent.eventType).toBe('behavior');
    });

    it('should truncate string fields that exceed max length', () => {
      const longString = 'a'.repeat(2000);
      const data = {
        appId: 'app_001',
        events: [
          {
            msgId: longString,
            deviceId: 'device_abc',
            eventTime: Date.now(),
            eventType: 'behavior',
            platform: 'web',
          },
        ],
      };

      const result = service.validateBatch(data);

      expect(result.events[0].errors.length).toBeGreaterThan(0);
      expect((result.events[0].sanitizedEvent.msgId as string).length).toBe(64);
    });

    it('should handle invalid data field gracefully', () => {
      const data = {
        appId: 'app_001',
        events: [
          {
            msgId: 'msg_001',
            deviceId: 'device_abc',
            eventTime: Date.now(),
            eventType: 'behavior',
            platform: 'web',
            data: 'not a json object',
          },
        ],
      };

      const result = service.validateBatch(data);

      expect(result.events[0].sanitizedEvent.data).toEqual({});
    });

    it('should sanitize invalid timestamp to current time', () => {
      const data = {
        appId: 'app_001',
        events: [
          {
            msgId: 'msg_001',
            deviceId: 'device_abc',
            eventTime: 'invalid_timestamp',
            eventType: 'behavior',
            platform: 'web',
          },
        ],
      };

      const result = service.validateBatch(data);

      expect(result.events[0].sanitizedEvent.eventTime).toBeDefined();
      expect(typeof result.events[0].sanitizedEvent.eventTime).toBe('number');
    });

    it('should sanitize null userId to undefined', () => {
      const data = {
        appId: 'app_001',
        events: [
          {
            msgId: 'msg_001',
            deviceId: 'device_abc',
            userId: null,
            eventTime: Date.now(),
            eventType: 'behavior',
            platform: 'web',
          },
        ],
      };

      const result = service.validateBatch(data);

      expect(result.events[0].sanitizedEvent.userId).toBeUndefined();
    });

    it('should apply defaults for missing optional fields', () => {
      const data = {
        appId: 'app_001',
        events: [
          {
            msgId: 'msg_001',
            deviceId: 'device_abc',
            eventTime: Date.now(),
            eventType: 'behavior',
            platform: 'web',
          },
        ],
      };

      const result = service.validateBatch(data);

      expect(result.events[0].sanitizedEvent.data).toEqual({});
      expect(result.events[0].sanitizedEvent.userAgent).toBeUndefined();
    });

    it('should validate multiple events in batch', () => {
      const data = {
        appId: 'app_001',
        events: [
          {
            msgId: 'msg_001',
            deviceId: 'device_abc',
            eventTime: Date.now(),
            eventType: 'behavior',
            platform: 'web',
          },
          {
            msgId: 'msg_002',
            deviceId: 'device_def',
            eventTime: Date.now(),
            eventType: 'performance',
            platform: 'ios',
          },
          {
            msgId: 'msg_003',
            deviceId: 'device_ghi',
            eventTime: Date.now(),
            eventType: 'error',
            platform: 'android',
          },
        ],
      };

      const result = service.validateBatch(data);

      expect(result.valid).toBe(true);
      expect(result.events.length).toBe(3);
      expect(result.events[0].sanitizedEvent.eventType).toBe('behavior');
      expect(result.events[1].sanitizedEvent.eventType).toBe('performance');
      expect(result.events[2].sanitizedEvent.eventType).toBe('error');
    });
  });

  describe('validateSingleEvent', () => {
    it('should validate single event with all required fields', () => {
      const event = {
        msgId: 'msg_001',
        deviceId: 'device_abc',
        eventTime: Date.now(),
        eventType: 'behavior',
        platform: 'web',
      };

      const result = service.validateSingleEvent(event, 0);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject null or undefined event', () => {
      const result = service.validateSingleEvent(null as any, 0);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('null or undefined');
    });

    it('should generate msgId if missing', () => {
      const event = {
        deviceId: 'device_abc',
        eventTime: Date.now(),
        eventType: 'behavior',
        platform: 'web',
      };

      const result = service.validateSingleEvent(event, 0);

      expect(result.sanitizedEvent.msgId).toBeDefined();
      expect(result.sanitizedEvent.msgId).toMatch(/^auto_/);
    });

    it('should use unknown_device when deviceId is missing', () => {
      const event = {
        msgId: 'msg_001',
        eventTime: Date.now(),
        eventType: 'behavior',
        platform: 'web',
      };

      const result = service.validateSingleEvent(event, 0);

      expect(result.sanitizedEvent.deviceId).toBe('unknown_device');
    });
  });

  describe('validateSchema', () => {
    it('should validate correct BuriedPointDto schema', () => {
      const validData = {
        appId: 'app_001',
        events: [
          {
            msgId: 'msg_001',
            deviceId: 'device_abc',
            eventTime: Date.now(),
            eventType: 'behavior',
            platform: 'web',
          },
        ],
      };

      const result = service.validateSchema(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject invalid schema', () => {
      const invalidData = {
        events: [],
      };

      const result = service.validateSchema(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
