# LinkedIn Post Generator

An Expo Go app that generates LinkedIn post ideas and posts or schedules them to your
personal LinkedIn account straight from the app. It needs no LinkedIn API, developer app,
or Company Page.

## How it works

- **Refresh** writes a batch of post ideas. With an Anthropic API key (Settings), Claude
  writes them from your topics, tone and background. Without a key, the app mixes built-in
  templates with your topics.
- Each idea is editable. **Post** publishes it now. **Schedule** lets you pick a date and
  time, and LinkedIn's own scheduler holds the post, so your phone doesn't need to be on
  when it goes out.
- Posting uses a LinkedIn page that the app keeps logged in, hidden behind the app. It
  opens the normal "Start a post" composer, types your text, and clicks Post (or uses the
  clock button to schedule). Tap the **LinkedIn / Log in** pill to open that page, which
  is how you log in and how you can watch what the bot does.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone.

1. Tap **Log in** and sign in with your LinkedIn email and password. Google and Apple
   sign-in don't work inside embedded browsers, so use a password. If you normally use
   Google, set a LinkedIn password first under Settings → Sign in & security. Tap
   **Done** once your feed shows up.
2. Open **Settings**: set your topics, a bit about you, your tone, and optionally your
   Anthropic API key (from https://console.anthropic.com).
3. Tap **Refresh ideas**, then **Post** or **Schedule** on any idea.

## Things to know

- **This is automation of LinkedIn's website, which LinkedIn's User Agreement prohibits.**
  Your account could be restricted. Keep it to a human pace, a few posts a day at most.
- **LinkedIn changes its site.** When that happens, a post fails with a message naming the
  step that broke (e.g. `Timed out waiting for the "Start a post" button`). The element
  finders are all in `src/linkedin/script.ts`. Tap the LinkedIn pill to watch the page
  while it runs.
- **Schedule fields are filled in US format** (`10/3/2026`, `9:15 AM`). If your LinkedIn
  shows dates differently, change `linkedInDateTime` in `App.tsx`.
- The Anthropic API key is kept in the phone's secure storage and sent only to Anthropic.
  Each Refresh costs a fraction of a cent.

## Code map

| File | What it does |
| --- | --- |
| `App.tsx` | Main screen: Refresh, idea cards, history, wiring |
| `src/generate.ts` | Post generation (Claude, or offline templates) |
| `src/linkedin/LinkedInBrowser.tsx` | The hidden, logged-in LinkedIn page and its action queue |
| `src/linkedin/script.ts` | JavaScript injected into LinkedIn to post and schedule |
| `src/components/` | Post card, schedule picker, settings screen |
| `src/storage.ts` | Saved settings, ideas, and history |
