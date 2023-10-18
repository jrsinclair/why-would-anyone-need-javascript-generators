import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown';
import Notes from 'reveal.js/plugin/notes/notes.esm';
import Highlight from 'reveal.js/plugin/highlight/highlight.esm';

const numericHeadings = () => {
  const $$: typeof document.querySelectorAll = document.querySelectorAll.bind(document);
  [...($$('h1, h2, h3') ?? [])].forEach((el) => {
    if (el.textContent?.match(/^[\d,→\s]+$/)) el.classList.add('numeric-heading');
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
    markdown: {
      smartypants: true,
    },
  })
  .then(numericHeadings);
