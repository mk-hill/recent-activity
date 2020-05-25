import 'source-map-support/register';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { Middy } from 'middy';
import { addMiddleware } from './middleware';
import { Logger } from 'winston';

interface HandlerResult {
  body?: any;
  statusCode?: number;
  logMessage?: string;
}

interface HttpHandlerOptions {
  eventHandler: HttpHandler;
  logger: Logger;
  errorMessage?: string;
}

export type HttpHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<HandlerResult>;

export const createHttpHandler = ({
  eventHandler,
  logger,
  errorMessage = 'Unable to perform operation',
}: HttpHandlerOptions): Middy<APIGatewayProxyEvent, APIGatewayProxyResult, Context> =>
  addMiddleware(async (event, context) => {
    logger.info('Received event', { event, context });
    try {
      const { body, logMessage, statusCode } = await eventHandler(event, context);
      logger.info(logMessage ?? 'Operation complete', { body, statusCode });
      return {
        statusCode: statusCode ?? 200,
        body: JSON.stringify(body),
      };
    } catch (error) {
      logger.error(errorMessage, { error });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: errorMessage }),
      };
    }
  });
