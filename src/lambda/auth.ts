import 'source-map-support/register';
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda';

import { createLogger } from '../util';
import { verifyToken } from '../auth/verifyToken';

const log = createLogger('lambda/auth');

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  log.info('Authorizing user', { token: event.authorizationToken });
  try {
    const token = await verifyToken(event.authorizationToken);
    log.info('User authorized', token);

    return {
      principalId: token.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
    };
  } catch (e) {
    log.error('User not authorized', { error: e.message });

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*',
          },
        ],
      },
    };
  }
};
