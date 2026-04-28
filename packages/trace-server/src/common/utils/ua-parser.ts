import { UAParser } from 'ua-parser-js';

/**
 * 解析User-Agent字符串，返回浏览器、设备、操作系统等信息
 * @param userAgent User-Agent字符串
 * @returns 解析后的UA信息
 */
export function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent);

  return {
    browser: parser.getBrowser(),
    device: parser.getDevice(),
    engine: parser.getEngine(),
    os: parser.getOS(),
    cpu: parser.getCPU(),
  };
}
