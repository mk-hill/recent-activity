import { Activity } from './Activity';

export interface GitLabActivity extends Activity {
  repoName?: string;
  isPrivate?: boolean;
  state?: string;
  squash?: boolean;
  performedAt?: string;
  mergedAt?: string;
  closedAt?: string;
  mergedBy?: string;
  closedBy?: string;
  targetBranch?: string;
  sourceBranch?: string;
  approvals?: number;
  publicId?: string;
}
