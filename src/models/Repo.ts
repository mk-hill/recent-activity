import { Commit } from './Commit';
import { MergeRequest } from './MergeRequest';

export interface Repo {
  name: string;
  commits?: Commit[];
  commitMap?: Record<string, Commit>;
  mergeRequests?: MergeRequest[];
  isPrivate: boolean;
  url?: string;
}
