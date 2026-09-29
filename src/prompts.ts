export type Prompt = {
  id: string;
  /** What the AI is asked to write about. */
  text: string;
  /** Short topic used by the offline templates when there's no API key. */
  topic: string;
};

export const PROMPTS: Prompt[] = [
  { id: 'hard-lesson', text: 'A lesson I learned the hard way at work', topic: 'work' },
  { id: 'career-advice', text: 'Advice for someone starting their career in tech', topic: 'tech careers' },
  { id: 'productivity', text: 'A productivity habit that actually works for me', topic: 'productivity' },
  { id: 'hot-take', text: 'An unpopular opinion about software engineering', topic: 'software engineering' },
  { id: 'remote-work', text: 'What remote work taught me about communication', topic: 'remote work' },
  { id: 'side-project', text: 'Why everyone should build a side project', topic: 'side projects' },
  { id: 'mistake', text: 'A mistake I made and what I would do differently', topic: 'growth' },
  { id: 'ai-tools', text: 'How AI tools are changing the way I work', topic: 'AI' },
  { id: 'leadership', text: 'What makes a great manager or team lead', topic: 'leadership' },
  { id: 'job-search', text: 'Tips for landing your next job', topic: 'job searching' },
  { id: 'learning', text: 'How I keep learning new skills while working full time', topic: 'learning' },
  { id: 'burnout', text: 'Avoiding burnout without losing ambition', topic: 'burnout' },
  { id: 'networking', text: 'Networking for people who hate networking', topic: 'networking' },
  { id: 'win', text: 'A recent win and what made it possible', topic: 'success' },
  { id: 'question', text: 'A question to get my network talking', topic: 'your industry' },
];

export const findPrompt = (id: string) => PROMPTS.find((p) => p.id === id);
