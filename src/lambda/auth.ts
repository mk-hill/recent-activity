import 'source-map-support/register';

import { createLogger } from '../logger';
import { verifyToken } from '../auth/verifyToken';
import { createAuthHandler, AuthHandler } from './util';

const logger = createLogger('lambda/authorizeJwt');

const authHandler: AuthHandler = async (event) => {
  const token = await verifyToken(event.authorizationToken);
  return token?.sub;
};

export const handler = createAuthHandler({
  authHandler,
  logger,
});
