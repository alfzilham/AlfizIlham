// Usage: npm run hash-password -- "your-password"
// Prints the value for ADMIN_PASSWORD_HASH_B64 (a bcrypt hash, base64 encoded so the $ signs survive .env files).
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Give a password of at least 10 characters: npm run hash-password -- "your-password"');
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log('ADMIN_PASSWORD_HASH_B64=' + Buffer.from(hash, 'utf8').toString('base64'));
