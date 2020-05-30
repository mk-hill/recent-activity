import { Activity } from './Activity';

export interface GitActivity extends Activity {
  repoName: string;
  isPrivate: boolean;
}
