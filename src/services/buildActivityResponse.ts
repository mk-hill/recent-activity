import { Activity, GitHubPush, MergeRequest } from '../models';
import { createLogger } from '../logger';

const log = createLogger('services/buildActivityResponse');

export function buildActivityResponse({ savedAt, partition, ...activity }: Activity): Activity | GitHubPush | MergeRequest {
  log.info('Creating activity dto', { activity });
  try {
    if (activity.source === 'github') {
      const { repoName, repoUrl, diffUrl, commits, isPrivate, ...publicProps } = activity as GitHubPush;

      if (isPrivate) {
        return publicProps;
      }

      return {
        repoName,
        repoUrl,
        diffUrl,
        commits,
        ...publicProps,
      };
    }

    if (activity.source === 'gitlab') {
      const { publicId, performedAt, state, source, type } = activity as MergeRequest;
      return {
        activityId: publicId,
        title: 'Opened a merge request in a private repository',
        performedAt,
        state,
        source,
        type,
      };
    }

    return activity;
  } catch (error) {
    log.error('Unable to create activity dto', { error });
    throw error;
  }
}
