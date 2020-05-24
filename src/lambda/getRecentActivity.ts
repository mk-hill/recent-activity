import 'source-map-support/register';

import { APIGatewayProxyHandler } from 'aws-lambda';
import { addMiddleware, createLogger } from '../util';
import { getRecentActivity } from '../services';

const log = createLogger('lambda/getRecentActivity');

const getActivities: APIGatewayProxyHandler = async (event, context) => {
  log.info('Received event', { event, context });
  try {
    const recentActivities = await getRecentActivity();
    log.info('Responding with recent activities', { recentActivities });
    return {
      statusCode: 200,
      body: JSON.stringify(recentActivities),
    };
  } catch (error) {
    const message = 'Unable to retrieve recent activity';
    log.error(message, { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    };
  }
};

export const handler = addMiddleware(getActivities);
