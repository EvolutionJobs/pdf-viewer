# `<pdf-viewer>`

Lit based custom element PDF viewer that supports regular expressions for term highlighting.

The primary goal is quick viewing of CVs held as PDFs. We needed more powerful term highlighting, as most PDF viewers can only highlight simple terms. For instance when highlighting _Java_ it should not include _Javascript_ - we can do this with `/\bjava\b/gim`.

This uses https://github.com/mozilla/pdf.js to render canvas elements for each page, and adds the viewer with regular expression highlighting as a custom element.

Simple example: 

```
<pdf-viewer src="..."></pdf-viewer>
```

## How it works

There are 3 main parts:
- `<pdf-viewer-page>` renders a single page and must be passed the PDF.js document proxy.
  - Each page renders with a `<canvas>` for the content and a transparent text overlay for highlighting.
- `<pdf-viewer-document>` renders the document as a collection of pages. You can use this on its own and add your own UI.
  - `@pdf-document-loading` fires when the source has changed and loading is starting.
  - `@pdf-document-loaded` fires once the document has been successfully loaded (pages may still be rendering).
  - `@pdf-document-error` fires if an error is encountered while loading the document.   
- `<pdf-viewer>` wraps that in a Material Design UI similar to Chrome's own.
  - `<plain-text>` renders fallback content if the PDF fails (this is a requirement for us as we get a lot of corrupt CVs).
  - slot: `error` renders the error if PDF can't be parsed.
  - slot: `loader` renders the loading `<paper-spinner>`.
  - slot: `actions` renders the action buttons to zoom/fit the current page.
  
CSS styles use the following variables:
- `--pdf-background`, default: #888, content behind pages.
- `--pdf-paper`, default: #fff, colour of each page (overriden by canvas content).
- `--pdf-colour-1`, default: #f00, colour for 1st term highlight.
- `--pdf-colour-2`, default: #0f0, colour for 2nd term highlight.
- `--pdf-colour-3`, default: #00f, colour for 3rd term highlight.
- `--pdf-colour-4`, default: #fd0, colour for 4th term highlight.
- `--pdf-colour-5`, default: #0fd, colour for 5th term highlight.
- `--pdf-colour-6`, default: #d0f, colour for 6th term highlight.
- `--pdf-colour-7`, default: #df0, colour for 7th term highlight.
- `--pdf-colour-8`, default: #0df, colour for 8th term highlight. (subsequent terms repeat)
- `--pdf-highlight-opacity`, default .4, highlights appear over text with this opacity.

