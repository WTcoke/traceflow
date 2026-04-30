import { parseUserAgent, parseIP } from '../src/common/utils';

describe('Utils Tests', () => {
  describe('parseUserAgent', () => {
    it('should parse Chrome browser UA correctly', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const result = parseUserAgent(ua);

      expect(result.browser.name).toBe('Chrome');
      expect(result.os.name).toBe('Windows');
      expect(result.device.type).toBeUndefined(); // Desktop
    });

    it('should parse mobile Safari UA correctly', () => {
      const ua =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(ua);

      expect(result.browser.name).toBe('Mobile Safari');
      expect(result.os.name).toBe('iOS');
      expect(result.device.type).toBe('mobile');
    });

    it('should handle empty UA string', () => {
      const result = parseUserAgent('');
      expect(result.browser.name).toBeUndefined();
    });
  });

  describe('parseIP', () => {
    it('should parse Chinese IP correctly', () => {
      const ip = '202.108.22.5'; // Baidu IP
      const result = parseIP(ip);

      expect(result).not.toBeNull();
      expect(result?.country).toBe('中国');
      expect(result?.province).toContain('北京'); // Should be Beijing area
    });

    it('should parse local IP', () => {
      const ip = '127.0.0.1';
      const result = parseIP(ip);

      expect(result).not.toBeNull();
      expect(result?.country).toBe('0'); // Local/unknown
    });

    it('should handle invalid IP', () => {
      const result = parseIP('invalid.ip');
      expect(result).toBeNull();
    });

    it('should parse international IP', () => {
      const ip = '8.8.8.8'; // Google DNS
      const result = parseIP(ip);

      expect(result).not.toBeNull();
      expect(result?.country).toBe('美国');
    });
  });
});
