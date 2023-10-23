import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown';
import Notes from 'reveal.js/plugin/notes/notes.esm';
import Highlight from 'reveal.js/plugin/highlight/highlight.esm';

const $$: typeof document.querySelectorAll = document.querySelectorAll.bind(document);

const numericHeadings = () => {
  [...($$('h1, h2, h3') ?? [])].forEach((el) => {
    if (el.textContent?.match(/^[\d,→\s]+$/)) el.classList.add('numeric-heading');
  });
};

const codeClip = () => {
  $$('pre > code').forEach((el: HTMLElement) => {
    const clipboard = navigator.clipboard;
    el.addEventListener('click', () => {
      const txt =
        el.querySelectorAll('table').length === 0
          ? el.innerText
          : el.innerText.replace(/\n\n/g, '\n');
      clipboard.writeText(txt);
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 500);
    });
  });
};

let deck = new Reveal({
  plugins: [Markdown, Notes, Highlight],
});
deck
  .initialize({
    width: 1920,
    height: 1080,
    progress: false,
    hash: true,
    transition: 'none',
    viewDistance: 1,
    markdown: {
      smartypants: true,
    },
  })
  .then(() => {
    numericHeadings();
    codeClip();
  });
