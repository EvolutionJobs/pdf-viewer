import { LitElement, html, css, property, customElement, query, eventOptions, TemplateResult } from '../../lib/lit-element/lit-element.js';
import { termMaxOrdinal, termStyle, PdfTextSelectionEventArgs } from './pdf-viewer-page.js';
import { normaliseSearchTerms } from './pdf-viewer-document.js';

const styles = css`
:host {
    display: block;
}

#plainTextContent {
    white-space: pre-wrap;
    padding: 16px;
    margin: 16px auto;
    width: 80%;
    font-size: 12px;
    background-color: #fff;
    color: #333;
    text-shadow: none;
    box-shadow: 
        0 4px 5px 0 rgba(0, 0, 0, 0.14), 
        0 1px 10px 0 rgba(0, 0, 0, 0.12), 
        0 2px 4px -1px rgba(0, 0, 0, 0.4);
}`;

/** Represent the next index of a term */
interface FoundTerm {

    /** The index of the next term. */
    i: number;

    /** The permutation found. */
    found?: string;

    /** Optional flag whether the searched for term is a wildcard. */
    wildcard?: boolean;
}

/** Get the next index of any of the permutations of a term.
 * @param text The text to search.
 * @param pattern The permutations to search for.
 * @returns The index (i) of the next term and the permutation found. */
function nextIndexOf(text: string, pattern: RegExp): FoundTerm {
    if (!pattern)
        return { i: -1 };

    // We have multiple permutations, for instance "JS" and "Javascript"
    // We want the next instance of any, which means searching for all and taking the lowest index
    const results: FoundTerm[] = [];

    let rest = text;
    const match = pattern.exec(text);
    if (match) {
        const found = match[0];
        results.push({ found, i: match.index });
       // rest = text.substring(match.index + found.length);

    }

    if (results.length === 0)
        return { i: -1 };

    results.sort((a, b) => a.i - b.i);
    return results[0];
}

/** Parse the text into nodes to render with highlighting
 * @param text Text to find and replace terms in
 * @param terms The terms to look for
 * @param depth Optional depth
 * @generator
 * @yields Next content node */
function* parseForTerm(text: string, terms: RegExp[], depth = 0): IterableIterator<TemplateResult> {
    if (!terms || terms.length === 0 || !terms[0]) {
        yield html`${text.replace(/\S{50}/gi, '$& ')}`;
        return;
    }

    // Create the highlighted node to re-use
    const lookFor = terms[0];
    const className = `term term-${depth % termMaxOrdinal} `;

    // Find the next index of the term
    let next = nextIndexOf(text, lookFor);
    while (next.i >= 0) {
        // Parse the text before the first term with the remaining terms
        const before = text.substring(0, next.i);
        for (const n of parseForTerm(before, terms.slice(1), depth + 1))
            yield n;

        text = text.substring(next.i + next.found.length);

        // If wildcard adjust the highlight
        const startsWith = next.wildcard && !text.startsWith(' ') && !text.startsWith('.');

        yield html`<span class=${startsWith ? className + ' starts-with' : className}>${next.found}</span>`;

        next = nextIndexOf(text, lookFor);
    }

    // Parse remaining text with the remaining terms
    for (const n of parseForTerm(text, terms.slice(1), depth + 1))
        yield n;
}

/** PDF fall-back that renders text, but with similar highlight terms logic */
@customElement('plain-text')
class PlainText extends LitElement {

    static get styles() { return [styles, termStyle]; }

    private renderTextPreview(text: string, terms: RegExp[]) {

        // Fix #667: Weirdly a lot of our CVs seem to have carriage returns without line-feeds
        // Windows does \r\n, the web and everyone else just does \n, but these CVs are just \r
        // Replace \r when not followed by \n with the \r\n pair.
        // const fixLineFeed = text.replace(/\r[^\n]/g, '\r\n');
        const fixLineFeed = text.replace(/\r\n|\r/g, '\r\n');

        // Strip out possible tags before starting
        const fixInlineHtml = fixLineFeed.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const highlightContent = [...parseForTerm(fixInlineHtml, terms)];

        return html`
 <div id="plainTextContent"
    @mouseup=${this.textSelected}>${highlightContent}</div>`;
    }

    render() {
        if (!this.text)
            return html``;

        const hl = this.highlight ? [...normaliseSearchTerms(this.highlight)] : undefined;

        return this.renderTextPreview(this.text, hl);
    }

    @property()
    text: string;

    @property()
    highlight: string | RegExp | (string | RegExp)[];

    @eventOptions({capture:false})
    private textSelected(e: Event) {
        const selection = document.getSelection();
        if (!selection)
            return;

        const selectedText = selection.toString();
        if (selectedText && selectedText.length > 0)
            this.dispatchEvent(new CustomEvent<PdfTextSelectionEventArgs>('text-selection', {
                detail: { selection: selectedText, page: -1 },
                bubbles: true
            }));
    }
}