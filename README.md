# LinkedIn Post Generator

An Expo Go app that generates LinkedIn post ideas and posts or schedules them to your
personal LinkedIn account straight from the app. It needs no LinkedIn API, developer app,
or Company Page.

## How it works

- **Home** is a scrollable list of prompts. Tap one and the AI writes 5 post ideas for it.
  With an Anthropic API key, Claude writes them. Without a key, the app fills built-in
  templates. **↻ 5 new ideas** writes another batch, and **Home** (top right) goes back.
- Each idea is editable. **Post** publishes it now. **Schedule** lets you pick a date and
  time, and LinkedIn's own scheduler holds the post, so your phone doesn't need to be on
  when it goes out.
- Posting uses a LinkedIn page that the app keeps logged in, hidden behind the app. It
  opens the normal "Start a post" composer, types your text, and clicks Post (or uses the
  clock button to schedule). The first time you press Post, that page opens so you can
  log in.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone.

1. Optional: copy `.env.example` to `.env.local` and put your Anthropic API key (from
   https://console.anthropic.com) in it so Claude writes the posts. Restart `npx expo start`.
2. Tap a prompt, then **Post** or **Schedule** on any idea.
3. The first time, LinkedIn opens so you can log in with your email and password. Google
   and Apple sign-in don't work inside embedded browsers; if you normally use Google, set a
   LinkedIn password first under Settings → Sign in & security. Tap **Done** once your feed
   shows up, then press Post again.

## Things to know

- **This is automation of LinkedIn's website, which LinkedIn's User Agreement prohibits.**
  Your account could be restricted. Keep it to a human pace, a few posts a day at most.
- **LinkedIn changes its site.** When that happens, a post fails with a message naming the
  step that broke (e.g. `Timed out waiting for the "Start a post" button`). The element
  finders are all in `src/linkedin/script.ts`.
- **Schedule fields are filled in US format** (`10/3/2026`, `9:15 AM`). If your LinkedIn
  shows dates differently, change `linkedInDateTime` in `src/app/ideas.tsx`.
- The Anthropic API key is built into the app bundle, so don't share builds that contain it.
  Each batch of ideas costs a fraction of a cent.
- To change the prompts on the Home screen, edit `src/prompts.ts`.

## Code map

| File | What it does |
| --- | --- |
| `src/app/index.tsx` | Home: the list of prompts |
| `src/app/ideas.tsx` | The 5 ideas for a prompt, with Post, Schedule and Home |
| `src/prompts.ts` | The prompts shown on Home |
| `src/generate.ts` | Post generation (Claude, or offline templates) |
| `src/linkedin/LinkedInProvider.tsx` | Keeps the LinkedIn page alive across screens |
| `src/linkedin/LinkedInBrowser.tsx` | The hidden, logged-in LinkedIn page and its action queue |
| `src/linkedin/script.ts` | JavaScript injected into LinkedIn to post and schedule |
| `src/components/` | Post card and schedule picker |
| `src/storage.ts` | Past posts, so new ideas don't repeat them |
