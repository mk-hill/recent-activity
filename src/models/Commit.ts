export interface Commit {
  id: string;
  tree_id: string;
  distinct: boolean;
  message: string;
  timestamp: string;
  url: string;
  author: Author;
  committer: Author;
  added: string[];
  removed: string[];
  modified: string[];
}

interface Author {
  name: string;
  email: string;
  username: string;
}
