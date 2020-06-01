import { Activity, GitHubPush, MergeRequest, Commit, Repo } from '../../../models';
import { sortByDate, isGitHubPush, isMergeRequest } from '../util';
import { createLogger } from '../../../logger';

const log = createLogger('buildActivityHtml/categorizeActivities');

interface CategorizedActivityData {
  pushes: GitHubPush[];
  mergeRequests: MergeRequest[];
  otherActivities: Activity[];
  repos: Repo[];
  sources: Set<string>;
  types: Set<string>;
  commits: Commit[];
  hasPrivateActivity: boolean;
}

export function categorizeActivities(activities: Activity[]): CategorizedActivityData {
  const pushes: GitHubPush[] = [];
  const mergeRequests: MergeRequest[] = [];
  const otherActivities: Activity[] = [];

  let repos: Repo[] = [];
  const sources: Set<string> = new Set();
  const types: Set<string> = new Set();
  let commits: Commit[] = [];
  let hasPrivateActivity = false;

  const hashToCommit: Record<string, Commit> = {};
  const nameToRepo: Record<string, Repo> = {};

  activities.forEach((activity) => {
    try {
      const { source, type } = activity;
      sources.add(source);
      types.add(type);

      if (isGitHubPush(activity)) {
        const gitHubPush = activity as GitHubPush;
        const { repoName, commits, isPrivate, repoUrl } = gitHubPush;
        log.debug(`Found push to ${repoName} with ${commits} commits at ${gitHubPush.performedAt}`);

        if (!nameToRepo[repoName]) nameToRepo[repoName] = createRepo(repoName, isPrivate, repoUrl);

        if (isPrivate) {
          hasPrivateActivity = true;
        } else {
          // Overwrite repo details in case previous activity was made on it when it was private
          nameToRepo[repoName].isPrivate = isPrivate;
        }

        commits.forEach((commit: Commit) => {
          hashToCommit[commit.id] = commit;
          nameToRepo[repoName].commitMap[commit.id] = commit;
        });

        return pushes.push(gitHubPush);
      }

      if (isMergeRequest(activity)) {
        const mergeRequest = activity as MergeRequest;
        const { repoName, isPrivate } = mergeRequest;
        log.debug(`Found merge request in ${repoName} at ${mergeRequest.performedAt}`);

        if (!nameToRepo[repoName]) nameToRepo[repoName] = createRepo(repoName, isPrivate);

        nameToRepo[repoName].mergeRequests.push(mergeRequest);

        if (mergeRequest.isPrivate) hasPrivateActivity = true;

        return mergeRequests.push(mergeRequest);
      }

      log.debug('Found other activity', { activity });

      return otherActivities.push(activity);
    } catch (error) {
      log.error('Unable to categorize activity', { activity, error });
      throw error;
    }
  });

  commits = sortByDate(Object.values(hashToCommit));

  repos = Object.values(nameToRepo).map((repo) => ({
    ...repo,
    commits: sortByDate(Object.values(repo.commitMap)),
    mergeRequests: sortByDate(repo.mergeRequests),
  }));

  return {
    pushes,
    mergeRequests,
    otherActivities,
    repos,
    sources,
    types,
    commits,
    hasPrivateActivity,
  };
}

function createRepo(name: string, isPrivate: boolean, url = ''): Repo {
  return {
    name,
    isPrivate,
    url,
    commitMap: {},
    commits: [],
    mergeRequests: [],
  };
}
