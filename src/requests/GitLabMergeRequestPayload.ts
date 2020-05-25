export interface GitLabMergeRequestPayload {
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_by?: User;
  merged_at?: string;
  closed_by?: User;
  closed_at?: string;
  target_branch: string;
  source_branch: string;
  author: User;
  web_url: string;
  squash: boolean;
  approvals_before_merge?: number;
}

interface User {
  name: string;
  username: string;
}
