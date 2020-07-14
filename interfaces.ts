export interface Article {
  title?: string;
  link?: string;
  pubDate?: string;
  comments?: string;
  content?: string;
  contentSnippet?: string;
  isoDate?: string;
  keywords?: string;
  addDate?: Date;
}

export interface User {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export type SearchQuery = {
  page?: number;
  filter?: string;
};
