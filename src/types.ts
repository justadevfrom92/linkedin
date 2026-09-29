export type Settings = {
  /** Comma or newline separated topics the posts should be about. */
  topics: string;
  /** Who you are / what you do, so posts sound like you. */
  aboutMe: string;
  /** Voice of the posts, e.g. "casual, practical, a bit funny". */
  tone: string;
  /** How many post ideas each Refresh produces. */
  count: number;
};

export type DraftStatus = 'idle' | 'working' | 'posted' | 'scheduled' | 'failed';

export type Draft = {
  id: string;
  text: string;
  status: DraftStatus;
  /** Progress message while working, error message when failed. */
  note?: string;
  /** ISO time the post was published or scheduled for. */
  when?: string;
};

export type HistoryEntry = {
  id: string;
  text: string;
  kind: 'posted' | 'scheduled';
  /** ISO time it went live (posted) or is scheduled for. */
  when: string;
};

export const DEFAULT_SETTINGS: Settings = {
  topics: 'software engineering, career growth, productivity',
  aboutMe: '',
  tone: 'conversational, practical, no buzzwords',
  count: 5,
};
