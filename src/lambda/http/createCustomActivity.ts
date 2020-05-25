import 'source-map-support/register';

import { createLogger } from '../../logger';
import { createCustomActivity } from '../../services';
import { createHttpHandler } from '../util';

const logger = createLogger('http/createCustomActivity');

async function eventHandler(event) {
  const savedActivity = await createCustomActivity(JSON.parse(event.body));
  return {
    body: savedActivity,
    statusCode: 201,
    logMessage: 'Responding with created activity',
  };
}

export const handler = createHttpHandler({
  eventHandler,
  logger,
  errorMessage: 'Unable to create activity',
});
