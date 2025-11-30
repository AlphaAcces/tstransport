import { SignJWT } from 'jose';

const secret = process.env.SSO_JWT_SECRET || process.env.VITE_SSO_JWT_SECRET;

if (!secret) {
  console.error('Set SSO_JWT_SECRET or VITE_SSO_JWT_SECRET before running this script.');
  process.exit(1);
}

const subject = process.argv[2] ?? 'AlphaGrey';
const role = process.argv[3] ?? 'admin';
const name = process.argv[4] ?? 'Alpha Grey';

const encoder = new TextEncoder();

const token = await new SignJWT({ role, name })
  .setSubject(subject)
  .setIssuedAt()
  .setExpirationTime('10m')
  .setProtectedHeader({ alg: 'HS256' })
  .sign(encoder.encode(secret));

console.log(token);
