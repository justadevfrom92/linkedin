import Anthropic from '@anthropic-ai/sdk';

import { Settings } from './types';

const POSTS_SCHEMA = {
  type: 'object',
  properties: {
    posts: { type: 'array', items: { type: 'string' } },
  },
  required: ['posts'],
  additionalProperties: false,
};

function splitTopics(topics: string): string[] {
  return topics
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Writes `settings.count` fresh LinkedIn posts. Uses Claude when an API key is
 * set, otherwise falls back to the offline templates below.
 */
export async function generatePosts(
  settings: Settings,
  apiKey: string,
  recentPosts: string[],
): Promise<string[]> {
  if (!apiKey) return templatePosts(settings);

  const client = new Anthropic({ apiKey });
  const avoid = recentPosts.length
    ? `\n\nDon't repeat the angle of these recent posts:\n${recentPosts
        .slice(0, 10)
        .map((p) => `- ${p.split('\n')[0].slice(0, 140)}`)
        .join('\n')}`
    : '';

  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: POSTS_SCHEMA },
    },
    system:
      'You write LinkedIn posts for one person, in their own first-person voice. ' +
      'Each post is ready to publish as-is: a strong first line, short paragraphs, ' +
      'plain text only (no markdown, no bold/italics), at most 3 relevant hashtags at the end, ' +
      'and under 1,300 characters. Vary the format across posts: story, lesson learned, ' +
      'contrarian take, practical tips list, question to the audience. Never invent specific ' +
      'employers, numbers, or events about the author that were not given.',
    messages: [
      {
        role: 'user',
        content:
          `Write ${settings.count} different LinkedIn posts.\n\n` +
          `Topics: ${splitTopics(settings.topics).join(', ') || 'anything professional'}\n` +
          `Tone: ${settings.tone || 'conversational'}\n` +
          `About me: ${settings.aboutMe || '(not given)'}` +
          avoid,
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined to write these posts. Try different topics.');
  }
  const text = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('');
  const parsed = JSON.parse(text) as { posts: string[] };
  return parsed.posts.map((p) => p.trim()).filter(Boolean);
}

const TEMPLATES: ((topic: string) => string)[] = [
  (t) =>
    `The most underrated skill in ${t}?\n\nConsistency.\n\nNot the big launches. Not the viral wins. Just showing up, doing the work, and getting 1% better every week.\n\nWhat's one small habit that's paid off for you?\n\n#${tag(t)} #growth`,
  (t) =>
    `3 things I wish I knew earlier about ${t}:\n\n1. Nobody has it all figured out.\n2. Asking questions early saves weeks later.\n3. Your network matters as much as your skills.\n\nWhat would you add?\n\n#${tag(t)} #lessonslearned`,
  (t) =>
    `Unpopular opinion: most advice about ${t} is too complicated.\n\nStart simple. Ship something. Learn from real feedback. Repeat.\n\nAgree or disagree?\n\n#${tag(t)}`,
  (t) =>
    `A quick reminder for anyone working in ${t}:\n\nProgress isn't always visible. Some weeks you're building foundations nobody sees yet.\n\nKeep going.\n\n#${tag(t)} #motivation`,
  (t) =>
    `I've been thinking a lot about ${t} lately.\n\nThe people I see doing it best all have one thing in common: they're curious, not defensive.\n\nThey treat mistakes as data, not failures.\n\nWho's someone you've learned this from?\n\n#${tag(t)} #leadership`,
  (t) =>
    `If you're just getting started with ${t}, here's my advice:\n\n→ Learn the fundamentals first\n→ Build in public\n→ Find 2-3 people a few steps ahead of you\n→ Don't compare your chapter 1 to someone's chapter 20\n\n#${tag(t)} #career`,
];

function tag(topic: string): string {
  return topic.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'career';
}

function templatePosts(settings: Settings): string[] {
  const topics = splitTopics(settings.topics);
  if (!topics.length) topics.push('your career');
  const shuffled = [...TEMPLATES].sort(() => Math.random() - 0.5);
  return Array.from({ length: settings.count }, (_, i) => {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    return shuffled[i % shuffled.length](topic);
  });
}
