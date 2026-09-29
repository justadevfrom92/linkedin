import AsyncStorage from '@react-native-async-storage/async-storage';

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

const CUSTOM_KEY = 'customPrompts';
/** Built-in prompts you've deleted. They live in code, so they're hidden instead. */
const HIDDEN_KEY = 'hiddenPrompts';

async function readList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

const loadCustomPrompts = () => readList<Prompt>(CUSTOM_KEY);

/** Your own prompts (newest first), then the built-in ones. */
export async function loadPrompts(): Promise<Prompt[]> {
  const hidden = new Set(await readList<string>(HIDDEN_KEY));
  return [...(await loadCustomPrompts()), ...PROMPTS.filter((p) => !hidden.has(p.id))];
}

export async function getPrompt(id: string): Promise<Prompt | undefined> {
  return findPrompt(id) ?? (await loadCustomPrompts()).find((p) => p.id === id);
}

export async function addPrompt(text: string): Promise<Prompt> {
  const prompt: Prompt = { id: `custom-${Date.now().toString(36)}`, text, topic: text };
  await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify([prompt, ...(await loadCustomPrompts())]));
  return prompt;
}

/** Removes a prompt from the Home list on this phone. */
export async function deletePrompt(id: string): Promise<void> {
  if (findPrompt(id)) {
    const hidden = await readList<string>(HIDDEN_KEY);
    if (!hidden.includes(id)) await AsyncStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden, id]));
  } else {
    const custom = await loadCustomPrompts();
    await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(custom.filter((p) => p.id !== id)));
  }
}
