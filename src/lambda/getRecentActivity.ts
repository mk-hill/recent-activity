import 'source-map-support/register';

import { APIGatewayProxyHandler } from 'aws-lambda';
import { addMiddleware, createLogger } from '../util';

const log = createLogger('lambda/recent');

const getActivity: APIGatewayProxyHandler = async (event, context) => {
  log.info('Received event', { event, context });
  try {
    const recentActivity = [
      { title: 'placeholder 1', performedAt: new Date() },
      { title: 'placeholder 2', performedAt: new Date() },
    ];
    return {
      statusCode: 200,
      body: JSON.stringify(recentActivity),
    };
  } catch (error) {
    const message = 'Unable to retrieve recent activity';
    log.error(message, { error });
    return {
      statusCode: 500,
      body: message,
    };
  }
};

export const handler = addMiddleware(getActivity);
