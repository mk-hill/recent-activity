import { GitActivity } from './GitActivity';

export interface MergeRequest extends GitActivity {
  state?: string;
  squash?: boolean;
  mergedAt?: string;
  closedAt?: string;
  mergedBy?: string;
  closedBy?: string;
  targetBranch?: string;
  sourceBranch?: string;
  approvals?: number;
  publicId?: string;
}
