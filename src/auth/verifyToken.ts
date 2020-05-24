import { JwtPayload } from './JwtPayload';
import { verify } from 'jsonwebtoken';
import { createLogger } from '../util';

const log = createLogger('auth/verifyToken');
const jwtCert = process.env.JWT_CERT;

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header');

  if (!authHeader.toLowerCase().startsWith('bearer ')) throw new Error('Invalid authentication header');

  return authHeader.split(' ')[1];
}

export async function verifyToken(authHeader: string): Promise<JwtPayload> {
  try {
    const token = getToken(authHeader);
    return verify(token, jwtCert) as JwtPayload;
  } catch (error) {
    log.error('Unable verify token', { error });
    throw error;
  }
}
