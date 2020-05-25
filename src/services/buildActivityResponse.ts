import { Activity, GitHubPushActivity } from '../models';
import { createLogger } from '../logger';

const log = createLogger('services/buildActivityResponse');

export function buildActivityResponse({ savedAt, partition, ...activity }: Activity): Activity | GitHubPushActivity {
  log.info('Creating activity dto', { activity });
  try {
    if (activity.source === 'github') {
      const { repoName, repoUrl, diffUrl, commits, isPrivate, ...publicProps } = activity as GitHubPushActivity;

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

    return activity;
  } catch (error) {
    log.error('Unable to create activity dto', { error });
    throw error;
  }
}
