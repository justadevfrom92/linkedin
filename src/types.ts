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
