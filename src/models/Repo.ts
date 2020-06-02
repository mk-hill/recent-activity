import { Commit } from './Commit';
import { MergeRequest } from './MergeRequest';
import { GitActivity } from './GitActivity';

export interface Repo {
  name: string;
  commits?: Commit[];
  commitMap?: Record<string, Commit>;
  mergeRequests?: MergeRequest[];
  isPrivate: boolean;
  url?: string;
  creationActivity: GitActivity;
}
