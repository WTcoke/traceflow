import { hash as _hash } from 'bcrypt';

async function generate() {
  const password = '123456';
  const hash = await _hash(password, 10);
  console.log('======== 你的正确哈希 ========');
  console.log(hash);
  console.log('=============================');
}
generate();
