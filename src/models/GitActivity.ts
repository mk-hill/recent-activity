import { Activity } from './Activity';

export interface GitActivity extends Activity {
  repoName: string;
  repoUrl: string;
  isPrivate: boolean;
}
