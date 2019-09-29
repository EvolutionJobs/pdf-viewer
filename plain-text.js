var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, property, customElement, eventOptions } from '../../lib/lit-element/lit-element.js';
import { termMaxOrdinal, termStyle } from './pdf-viewer-page.js';
import { normaliseSearchTerms } from './pdf-viewer-document.js';
const styles = css `
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
function nextIndexOf(text, pattern) {
    if (!pattern)
        return { i: -1 };
    const results = [];
    let rest = text;
    const match = pattern.exec(text);
    if (match) {
        const found = match[0];
        results.push({ found, i: match.index });
    }
    if (results.length === 0)
        return { i: -1 };
    results.sort((a, b) => a.i - b.i);
    return results[0];
}
function* parseForTerm(text, terms, depth = 0) {
    if (!terms || terms.length === 0 || !terms[0]) {
        yield html `${text.replace(/\S{50}/gi, '$& ')}`;
        return;
    }
    const lookFor = terms[0];
    const className = `term term-${depth % termMaxOrdinal} `;
    let next = nextIndexOf(text, lookFor);
    while (next.i >= 0) {
        const before = text.substring(0, next.i);
        for (const n of parseForTerm(before, terms.slice(1), depth + 1))
            yield n;
        text = text.substring(next.i + next.found.length);
        const startsWith = next.wildcard && !text.startsWith(' ') && !text.startsWith('.');
        yield html `<span class=${startsWith ? className + ' starts-with' : className}>${next.found}</span>`;
        next = nextIndexOf(text, lookFor);
    }
    for (const n of parseForTerm(text, terms.slice(1), depth + 1))
        yield n;
}
let PlainText = class PlainText extends LitElement {
    static get styles() { return [styles, termStyle]; }
    renderTextPreview(text, terms) {
        const fixLineFeed = text.replace(/\r\n|\r/g, '\r\n');
        const fixInlineHtml = fixLineFeed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const highlightContent = [...parseForTerm(fixInlineHtml, terms)];
        return html `
 <div id="plainTextContent"
    @mouseup=${this.textSelected}>${highlightContent}</div>`;
    }
    render() {
        if (!this.text)
            return html ``;
        const hl = this.highlight ? [...normaliseSearchTerms(this.highlight)] : undefined;
        return this.renderTextPreview(this.text, hl);
    }
    textSelected(e) {
        const selection = document.getSelection();
        if (!selection)
            return;
        const selectedText = selection.toString();
        if (selectedText && selectedText.length > 0)
            this.dispatchEvent(new CustomEvent('text-selection', {
                detail: { selection: selectedText, page: -1 },
                bubbles: true
            }));
    }
};
__decorate([
    property()
], PlainText.prototype, "text", void 0);
__decorate([
    property()
], PlainText.prototype, "highlight", void 0);
__decorate([
    eventOptions({ capture: false })
], PlainText.prototype, "textSelected", null);
PlainText = __decorate([
    customElement('plain-text')
], PlainText);
//# sourceMappingURL=plain-text.js.map