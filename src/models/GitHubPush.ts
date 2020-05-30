import { Commit } from './Commit';
import { GitActivity } from './GitActivity';

export interface GitHubPush extends GitActivity {
  repoUrl: string;
  commits: Commit[];
  diffUrl: string;
}
