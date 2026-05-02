const { spawnSync } = require('child_process');

function run(command, args) {
  return spawnSync(command, args, {
    cwd: __dirname + '/..',
    stdio: 'pipe',
    encoding: 'utf8',
    shell: false,
  });
}

console.log('Stopping node processes...');
run('taskkill', ['/F', '/IM', 'node.exe']);

console.log('Stopping docker compose...');
run('docker', ['compose', 'down']);

console.log('Done.');
