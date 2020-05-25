import 'source-map-support/register';

import { createLogger } from '../../logger';
import { createHttpHandler } from '../util';
import { verifyGitHubSignature as isSignatureValid } from '../../auth';
import { GitHubWebhookPayload } from '../../requests';
import { createGitHubPushActivity } from '../../services';

const logger = createLogger('http/createGitHubActivity');

async function eventHandler(event) {
  const signature = event.headers['X-Hub-Signature'];
  const { body } = event;

  if (!isSignatureValid(signature, body)) {
    return {
      statusCode: 401,
      logMessage: 'Invalid signature',
    };
  }

  if (event.headers['X-GitHub-Event'] === 'ping') {
    return {
      statusCode: 200,
      logMessage: 'Ping received',
    };
  }

  const payload: GitHubWebhookPayload = JSON.parse(body);

  if (payload.pusher.name !== 'mk-hill' || event.headers['X-GitHub-Event'] !== 'push') {
    return {
      statusCode: 422,
    };
  }
  const { id: activityId, timestamp: performedAt } = payload.head_commit;
  const { commits, compare: diffUrl } = payload;
  const { name: repoName, url: repoUrl, private: isPrivate } = payload.repository;

  const createdActivity = await createGitHubPushActivity({ activityId, commits, diffUrl, repoName, repoUrl, isPrivate, performedAt });
  return {
    statusCode: 201,
    body: createdActivity,
    logMessage: 'Created GitHub activity',
  };
}

export const handler = createHttpHandler({
  eventHandler,
  logger,
  errorMessage: 'Unable to create GitHub activity',
});
