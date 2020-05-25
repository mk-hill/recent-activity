import 'source-map-support/register';
import { CustomAuthorizerEvent, Context, CustomAuthorizerResult } from 'aws-lambda';
import { Logger } from 'winston';

export type AuthHandler = (event: CustomAuthorizerEvent, context: Context) => Promise<string>;

interface AuthHandlerOptions {
  authHandler: AuthHandler;
  logger: Logger;
}

export const createAuthHandler = ({ authHandler, logger }: AuthHandlerOptions) => async (
  event: CustomAuthorizerEvent,
  context: Context
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing operation', { event });
  try {
    const principalId = await authHandler(event, context);

    if (!principalId) {
      throw new Error('Operation not authorized');
    }

    logger.info('Operation authorized', { principalId });
    return {
      principalId,
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
  } catch (error) {
    logger.error('Operation not authorized', { error });

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
