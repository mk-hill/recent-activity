import 'source-map-support/register';

import { createLogger } from '../../logger';
import { createHttpHandler } from '../util';
import { GitLabMergeRequestPayload } from '../../requests';
import { createGitLabActivity } from '../../services';

const logger = createLogger('http/createGitLabActivity');

async function eventHandler(event) {
  const payload: GitLabMergeRequestPayload = JSON.parse(event.body);

  if (payload.author?.username !== process.env.GITLAB_USERNAME) {
    return {
      statusCode: 422,
    };
  }

  const {
    title,
    description,
    state,
    squash,
    created_at: performedAt,
    merged_at: mergedAt,
    closed_at: closedAt,
    target_branch: targetBranch,
    source_branch: sourceBranch,
    approvals_before_merge: approvals,
  } = payload;

  const [repoName, mrNumber] = payload.web_url.replace('/merge_requests', '').split('/').slice(-2);
  const activityId = `${repoName}/${mrNumber}`;
  const mergedBy = payload.merged_by?.name;
  const closedBy = payload.closed_by?.name;

  const data = {
    activityId,
    repoName,
    title,
    description,
    state,
    squash,
    performedAt,
    mergedAt,
    closedAt,
    mergedBy,
    closedBy,
    targetBranch,
    sourceBranch,
    approvals,
  };

  logger.info('Persed GitLab activity data', { data });
  const savedActivity = await createGitLabActivity(data);
  return {
    body: savedActivity,
    statusCode: 201,
    logMessage: 'Responding with created GitLab activity',
  };
}

export const handler = createHttpHandler({
  eventHandler,
  logger,
  errorMessage: 'Unable to create GitLab activity',
});
