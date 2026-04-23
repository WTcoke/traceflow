const { spawnSync } = require('child_process');

function run(args) {
  return spawnSync('docker', args, {
    cwd: __dirname + '/..',
    stdio: 'pipe',
    encoding: 'utf8',
    shell: false,
  });
}

function fail(result, label) {
  if (result.status === 0) return;
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  console.error(output || `${label} failed`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting MySQL container...');
  fail(run(['compose', 'up', '-d']), 'docker compose up -d');

  console.log('Waiting for MySQL to be ready...');
  for (let i = 0; i < 30; i += 1) {
    const result = run([
      'exec',
      'traceflow-mysql',
      'mysqladmin',
      'ping',
      '-h',
      'localhost',
      '-u',
      'root',
      '-prootpassword',
      '--silent',
    ]);

    if (result.status === 0) {
      console.log('MySQL is ready.');
      return;
    }

    await sleep(2000);
  }

  console.error('MySQL failed to start within 60 seconds.');
  process.exit(1);
}

main();
