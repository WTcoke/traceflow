import { parseUserAgent, parseIP } from './src/common/utils';

// 示例：测试UA解析和IP解析工具
console.log('=== UA解析和IP解析工具测试示例 ===\n');

// 测试UA解析
console.log('1. UA解析测试：');
const uaExamples = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
];

uaExamples.forEach((ua, index) => {
  console.log(`\nUA ${index + 1}:`);
  console.log(`输入: ${ua}`);
  const result = parseUserAgent(ua);
  console.log(`浏览器: ${result.browser.name} ${result.browser.version}`);
  console.log(`操作系统: ${result.os.name} ${result.os.version}`);
  console.log(`设备类型: ${result.device.type || 'Desktop'}`);
});

// 测试IP解析
console.log('\n\n2. IP解析测试：');
const ipExamples = [
  '202.108.22.5', // 百度IP
  '8.8.8.8', // Google DNS
  '127.0.0.1', // 本地IP
  '192.168.1.1', // 私有IP
];

ipExamples.forEach((ip, index) => {
  console.log(`\nIP ${index + 1}: ${ip}`);
  const result = parseIP(ip);
  if (result) {
    console.log(`国家: ${result.country}`);
    console.log(`省份: ${result.province}`);
    console.log(`城市: ${result.city}`);
    console.log(`ISP: ${result.isp}`);
  } else {
    console.log('解析失败');
  }
});

console.log('\n=== 测试完成 ===');
