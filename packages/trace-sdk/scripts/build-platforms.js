/**
 * 批量构建各平台产物
 * 用法: node scripts/build-platforms.js
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process');
const path = require('path');

const platforms = ['web', 'weixin', 'alipay', 'baidu', 'toutiao', 'nodejs'];
const rootDir = path.resolve(__dirname, '..');

let failed = [];

for (const platform of platforms) {
  console.log(`\n========== Building ${platform} ==========`);
  try {
    execSync(`npx vite build --config vite.config.${platform}.ts`, {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log(`✓ ${platform} built successfully`);
  } catch (error) {
    console.error(`✗ ${platform} build failed`);
    failed.push(platform);
  }
}

console.log('\n========== Build Summary ==========');
if (failed.length === 0) {
  console.log('All platforms built successfully!');
} else {
  console.log(`Failed platforms: ${failed.join(', ')}`);
  process.exit(1);
}
