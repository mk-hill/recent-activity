import { APIGatewayProxyHandler } from 'aws-lambda';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';

export const addMiddleware = (handler: APIGatewayProxyHandler) => middy(handler).use(cors({ origin: '*', credentials: true }));
