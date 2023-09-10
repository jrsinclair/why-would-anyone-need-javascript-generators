import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown';
import Notes from 'reveal.js/plugin/notes/notes.esm';
import Highlight from 'reveal.js/plugin/highlight/highlight.esm';

let deck = new Reveal({
  plugins: [Markdown, Notes, Highlight],
});
deck.initialize({
  width: 1792,
  height: 1120,
  markdown: {
    smartypants: true,
  },
});
