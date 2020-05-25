import { createLogger } from '../logger';
import { Activities } from '../data';
import { GitHubPushActivity, Activity, Commit } from '../models';
import { buildActivityResponse } from './buildActivityResponse';

const log = createLogger('services/createGitHubActivity');

interface GitHubPushWebhookData {
  activityId: string;
  isPrivate: boolean;
  repoUrl: string;
  repoName: string;
  commits: Commit[];
  diffUrl: string;
  performedAt: string;
}

export async function createGitHubPushActivity({ performedAt, ...props }: GitHubPushWebhookData): Promise<Activity> {
  log.info('Creating GitHub push activity from webhook data', { webhookData: props });
  try {
    const numCommits = props.commits.length;
    const activity: GitHubPushActivity = {
      ...props,
      partition: process.env.PARTITION,
      performedAt: new Date(performedAt).toISOString(),
      title: `Created ${numCommits} commit${numCommits !== 1 ? 's' : ''} in ${props.isPrivate ? 'a private repository' : props.repoName}.`,
      source: 'github',
      type: 'push',
    };
    log.info('Saving GitHub push activity', { activity });
    return Activities.create(activity).then(buildActivityResponse);
  } catch (error) {
    log.error('Unable to create GitHub push activity', { error });
    throw error;
  }
}
