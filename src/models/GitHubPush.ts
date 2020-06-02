import { Commit } from './Commit';
import { GitActivity } from './GitActivity';

export interface GitHubPush extends GitActivity {
  commits: Commit[];
  diffUrl: string;
}
