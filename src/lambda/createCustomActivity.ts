import 'source-map-support/register';

import { APIGatewayProxyHandler } from 'aws-lambda';
import { addMiddleware, createLogger } from '../util';
import { createCustomActivity } from '../services';

const log = createLogger('lambda/createCustomActivity');

const createActivity: APIGatewayProxyHandler = async (event, context) => {
  log.info('Received event', { event, context });
  try {
    const activity = await createCustomActivity(JSON.parse(event.body));
    log.info('Responding with created activity', { activity });
    return {
      statusCode: 201,
      body: JSON.stringify(activity),
    };
  } catch (error) {
    const message = 'Unable to create activity';
    log.error(message, { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    };
  }
};

export const handler = addMiddleware(createActivity);
