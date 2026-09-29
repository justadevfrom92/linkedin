import Anthropic from '@anthropic-ai/sdk';

import { Prompt } from './prompts';

export const POSTS_PER_PROMPT = 5;

const POSTS_SCHEMA = {
  type: 'object',
  properties: {
    posts: { type: 'array', items: { type: 'string' } },
  },
  required: ['posts'],
  additionalProperties: false,
};

/**
 * Writes the next batch of LinkedIn posts for a prompt. Uses Claude when an
 * API key is set, otherwise falls back to the offline templates below.
 *
 * @param avoid posts already shown or published, so the batch doesn't repeat them
 * @param offset how many ideas were already generated for this prompt
 */
export async function generatePosts(
  prompt: Prompt,
  apiKey: string,
  avoid: string[],
  offset: number,
): Promise<string[]> {
  if (!apiKey) return templatePosts(prompt.topic, offset);

  const client = new Anthropic({ apiKey });
  const avoidText = avoid.length
    ? `\n\nEach post must take a different angle from these existing posts:\n${avoid
        .slice(0, 40)
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
      'contrarian take, practical tips list, question to the audience. Write in a conversational, ' +
      'practical voice with no buzzwords. Never invent specific ' +
      'employers, numbers, or events about the author that were not given.',
    messages: [
      {
        role: 'user',
        content: `Write ${POSTS_PER_PROMPT} different LinkedIn posts about: ${prompt.text}` + avoidText,
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

// Offline templates: every body pairs with every closing line, so one prompt
// gets BODIES.length * CLOSERS.length distinct posts before any repeat.
const BODIES: ((topic: string) => string)[] = [
  (t) =>
    `The most underrated skill in ${t}?\n\nConsistency.\n\nNot the big launches. Not the viral wins. Just showing up, doing the work, and getting 1% better every week.`,
  (t) =>
    `3 things I wish I knew earlier about ${t}:\n\n1. Nobody has it all figured out.\n2. Asking questions early saves weeks later.\n3. Your network matters as much as your skills.`,
  (t) =>
    `Unpopular opinion: most advice about ${t} is too complicated.\n\nStart simple. Ship something. Learn from real feedback. Repeat.`,
  (t) =>
    `A quick reminder for anyone working on ${t}:\n\nProgress isn't always visible. Some weeks you're building foundations nobody sees yet.\n\nKeep going.`,
  (t) =>
    `I've been thinking a lot about ${t} lately.\n\nThe people I see doing it best all have one thing in common: they're curious, not defensive.\n\nThey treat mistakes as data, not failures.`,
  (t) =>
    `If you're just getting started with ${t}, here's my advice:\n\n→ Learn the fundamentals first\n→ Build in public\n→ Find 2-3 people a few steps ahead of you\n→ Don't compare your chapter 1 to someone's chapter 20`,
  (t) =>
    `The biggest shift in how I think about ${t}:\n\nI used to optimize for looking busy.\n\nNow I optimize for finishing things that matter.`,
  (t) =>
    `Hot take on ${t}: the basics beat the hacks.\n\nClear communication. Showing up on time. Following through.\n\nBoring? Maybe. But it compounds.`,
];

const CLOSERS = [
  "What's one thing that's worked for you?",
  'Agree or disagree?',
  'What would you add?',
  "Who's someone you've learned this from?",
  "What's the best advice you've gotten on this?",
];

function tag(topic: string): string {
  return topic.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'career';
}

function templatePosts(topic: string, offset: number): string[] {
  return Array.from({ length: POSTS_PER_PROMPT }, (_, i) => {
    const n = offset + i;
    const body = BODIES[n % BODIES.length](topic);
    // Step the closer with each pass through the bodies, so pairs never repeat.
    const closer = CLOSERS[(n + Math.floor(n / BODIES.length)) % CLOSERS.length];
    return `${body}\n\n${closer}\n\n#${tag(topic)}`;
  });
}
