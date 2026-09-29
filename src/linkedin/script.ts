/**
 * JavaScript injected into the hidden LinkedIn WebView. It drives the normal
 * desktop LinkedIn composer: open "Start a post", type the text, then click
 * "Post", or use the clock button to schedule it.
 *
 * It's a plain string (not a function's source) because Hermes doesn't keep
 * function source text at runtime. It reports progress back through
 * window.ReactNativeWebView.postMessage.
 *
 * LinkedIn changes its page layout from time to time. When a step starts
 * failing, the error names the step, and the element finders below are the
 * place to update.
 */

export type BotAction =
  | { kind: 'post'; text: string }
  /** date as M/D/YYYY and time as h:mm AM/PM, matching LinkedIn's scheduler fields. */
  | { kind: 'schedule'; text: string; date: string; time: string };

export type BotMessage =
  | { id: string; type: 'step'; step: string }
  | { id: string; type: 'done'; ok: true }
  | { id: string; type: 'done'; ok: false; error: string }
  | { id: string; type: 'status'; loggedIn: boolean };

const HELPERS = String.raw`
  function send(msg) { msg.id = P.id; window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function matches(el, re) {
    return re.test(clean(el.getAttribute('aria-label'))) || re.test(clean(el.innerText || el.textContent));
  }
  function find(root, selector, re) {
    var list = (root || document).querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      if (visible(list[i]) && matches(list[i], re)) return list[i];
    }
    return null;
  }
  async function waitFor(fn, ms, what) {
    var end = Date.now() + ms;
    while (Date.now() < end) {
      try { var v = fn(); if (v) return v; } catch (e) {}
      await sleep(300);
    }
    throw new Error('Timed out waiting for ' + what);
  }
  function loginPage() {
    return /\/(login|checkpoint|authwall|signup|uas)\b/.test(location.pathname);
  }
  function startButton() {
    return find(document, 'button, [role="button"]', /start a post/i);
  }
`;

const STATUS_BODY = String.raw`
  (async function () {
    if (loginPage()) return send({ type: 'status', loggedIn: false });
    try {
      await waitFor(startButton, 10000, 'feed');
      send({ type: 'status', loggedIn: true });
    } catch (e) {
      send({ type: 'status', loggedIn: false });
    }
  })();
`;

const ACTION_BODY = String.raw`
  function dialog() {
    var ds = document.querySelectorAll('[role="dialog"]');
    for (var i = ds.length - 1; i >= 0; i--) if (visible(ds[i])) return ds[i];
    return null;
  }
  function editorIn(root) {
    return (root || document).querySelector('.ql-editor[contenteditable="true"], [role="textbox"][contenteditable="true"]');
  }
  function composer() {
    var d = dialog();
    return d && editorIn(d) ? d : null;
  }
  function enabled(el) {
    return el && !el.disabled && el.getAttribute('aria-disabled') !== 'true' ? el : null;
  }
  function click(el) {
    el.scrollIntoView({ block: 'center' });
    el.click();
  }
  function setInput(el, value) {
    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    el.focus();
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function findInput(root, re, except) {
    var ins = root.querySelectorAll('input');
    for (var i = 0; i < ins.length; i++) {
      var el = ins[i];
      if (el === except || !visible(el)) continue;
      var lab = [el.getAttribute('aria-label'), el.name, el.id, el.placeholder].join(' ');
      if (el.id) {
        var l = root.querySelector('label[for="' + el.id + '"]');
        if (l) lab += ' ' + l.textContent;
      }
      if (re.test(lab)) return el;
    }
    return null;
  }
  function escapeRe(s) { return s.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&'); }

  async function openComposer() {
    if (loginPage()) throw new Error('NOT_LOGGED_IN');
    if (composer()) return composer();
    var btn = await waitFor(startButton, 20000, 'the "Start a post" button');
    click(btn);
    return waitFor(composer, 15000, 'the post editor to open');
  }

  async function typeText(d, text) {
    var ed = editorIn(d);
    ed.focus();
    // Clear any draft LinkedIn restored from last time.
    document.execCommand('selectAll');
    document.execCommand('delete');
    var probe = clean(text).slice(0, 40);
    try {
      var dt = new DataTransfer();
      dt.setData('text/plain', text);
      ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    } catch (e) {}
    await sleep(700);
    if (clean(ed.innerText).indexOf(probe) === -1) {
      ed.focus();
      document.execCommand('selectAll');
      document.execCommand('delete');
      var lines = text.split('\n');
      for (var i = 0; i < lines.length; i++) {
        if (i > 0) document.execCommand('insertParagraph');
        if (lines[i]) document.execCommand('insertText', false, lines[i]);
      }
      await sleep(700);
    }
    if (clean(ed.innerText).indexOf(probe) === -1) throw new Error('Could not type the post text into the editor');
  }

  async function schedule(date, time) {
    var clock = await waitFor(function () { return find(composer(), 'button', /schedule/i); }, 10000, 'the schedule (clock) button');
    click(clock);
    var dateInput = await waitFor(function () { var d = dialog(); return d && findInput(d, /date/i); }, 10000, 'the schedule date field');
    var timeInput = findInput(dialog(), /time/i, dateInput);
    if (!timeInput) throw new Error('Could not find the schedule time field');

    setInput(dateInput, date);
    dateInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    dateInput.blur();
    await sleep(500);

    setInput(timeInput, time);
    await sleep(700);
    var option = find(document, '[role="option"], li', new RegExp('^' + escapeRe(time) + '$', 'i'));
    if (option) click(option);
    else timeInput.blur();
    await sleep(500);

    var next = await waitFor(function () { return enabled(find(dialog(), 'button', /^next$/i)); }, 8000,
      'the "Next" button (LinkedIn may have rejected the date/time)');
    click(next);
    var final = await waitFor(function () { var d = composer(); return d && enabled(find(d, 'button', /^schedule$/i)); }, 10000,
      'the final "Schedule" button');
    click(final);
  }

  (async function () {
    try {
      send({ type: 'step', step: 'Opening the post editor' });
      var d = await openComposer();
      send({ type: 'step', step: 'Typing the post' });
      await typeText(d, P.action.text);
      if (P.action.kind === 'schedule') {
        send({ type: 'step', step: 'Setting the schedule' });
        await schedule(P.action.date, P.action.time);
      } else {
        send({ type: 'step', step: 'Publishing' });
        var post = await waitFor(function () { var c = composer(); return c && enabled(find(c, 'button', /^post$/i)); }, 10000,
          'the "Post" button to become clickable');
        click(post);
      }
      await waitFor(function () { return !composer(); }, 20000, 'LinkedIn to confirm');
      send({ type: 'done', ok: true });
    } catch (e) {
      send({ type: 'done', ok: false, error: String((e && e.message) || e) });
    }
  })();
`;

function wrap(payload: object, body: string): string {
  return `(function () {\nvar P = ${JSON.stringify(payload)};\n${HELPERS}\n${body}\n})();\ntrue;`;
}

export const statusScript = (id: string) => wrap({ id }, STATUS_BODY);

export const actionScript = (id: string, action: BotAction) => wrap({ id, action }, ACTION_BODY);
