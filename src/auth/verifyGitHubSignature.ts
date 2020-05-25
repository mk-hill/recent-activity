import * as crypto from 'crypto';
import { createLogger } from '../logger';

const log = createLogger('auth/verifyGitHubSignature');
const secret = process.env.GITHUB_SECRET;

export function verifyGitHubSignature(signature: string, body: string): boolean {
  log.info('Verifying GitHub signature', { signature, body });
  try {
    const [algorithm, receivedHash] = signature.split('=');
    const generatedHash = crypto.createHmac(algorithm, secret).update(body).digest('hex');
    log.debug('Comparing hashes', { generatedHash, receivedHash });
    return receivedHash === generatedHash;
  } catch (error) {
    log.error('Unable to verify GitHub signature', { error });
    return false;
  }
}
