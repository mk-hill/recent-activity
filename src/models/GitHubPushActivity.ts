import { Activity } from './Activity';
import { Commit } from './Commit';

export interface GitHubPushActivity extends Activity {
  isPrivate: boolean;
  repoUrl: string;
  repoName: string;
  commits: Commit[];
  diffUrl: string;
}
