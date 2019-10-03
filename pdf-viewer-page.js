var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, property, customElement, query, eventOptions } from '../../lib/lit-element/lit-element.js';
import { pdfApi } from './pdf-utility.js';
const styles = css `
:host {
    position: relative;
    display: inline-block;
    overflow: hidden;
    min-height: 200px;
    margin: var(--pdf-page-margin, 12px);
    margin-left: 0;
    margin-top: 0;
    width: min-content;
    box-shadow: 
        rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, 
        rgba(0, 0, 0, 0.12) 0px 1px 10px 0px, 
        rgba(0, 0, 0, 0.4) 0px 2px 4px -1px;
}

@keyframes animatedBackground {
    0% { background-position: 0% 50% }
    50% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
}

    :host(:not(.loading)) {
        background: var(--pdf-paper, #fff);
    }

    :host(.loading) {
        background-position: 0px 0px;
        background-size: 400% 400%;
        background-image: linear-gradient(to right, #fff 0%, #ccc 50%, #fff 100%);
        animation: animatedBackground 9s ease infinite;
    }

.term {
    margin-left: -2px;
}`;
const viewerCss = css `
.textLayer {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    opacity: var(--pdf-highlight-opacity, 0.4);
    line-height: 1.0;
}

    .textLayer > span {
        color: transparent;
        position: absolute;
        white-space: pre;
        cursor: text;
        -webkit-transform-origin: 0% 0%;
                transform-origin: 0% 0%;
    }

    .textLayer .highlight {
        margin: -1px;
        padding: 1px;

        background-color: rgb(180, 0, 170);
        border-radius: 4px;
    }

        .textLayer .highlight.begin {
            border-radius: 4px 0px 0px 4px;
        }

        .textLayer .highlight.end {
            border-radius: 0px 4px 4px 0px;
        }

        .textLayer .highlight.middle {
            border-radius: 0px;
        }

        .textLayer .highlight.selected {
            background-color: rgb(0, 100, 0);
        }

    .textLayer ::-moz-selection { background: rgb(0,0,255); }

    .textLayer ::selection { background: rgb(0,0,255); }

    .textLayer .endOfContent {
        display: block;
        position: absolute;
        left: 0px;
        top: 100%;
        right: 0px;
        bottom: 0px;
        z-index: -1;
        cursor: default;
        -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
                user-select: none;
    }

    .textLayer .endOfContent.active {
        top: 0px;
    }`;
export const termStyle = css `
.term {
    border-radius: 2px;
    padding: 0 2px;
}

    .term.term-0 { background: var(--pdf-colour-1, #f00); }
    .term.term-1 { background: var(--pdf-colour-2, #0f0); }
    .term.term-2 { background: var(--pdf-colour-3, #00f); }
    .term.term-3 { background: var(--pdf-colour-4, #fd0); }
    .term.term-4 { background: var(--pdf-colour-5, #0fd); }
    .term.term-5 { background: var(--pdf-colour-6, #d0f); }
    .term.term-6 { background: var(--pdf-colour-7, #df0); }
    .term.term-7 { background: var(--pdf-colour-8, #0df); }`;
export const termMaxOrdinal = 8;
function clearCanvas(canvas) {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}
function clearDom(parent) {
    const kids = parent.childNodes;
    while (kids && kids.length > 0)
        parent.removeChild(kids[kids.length - 1]);
}
const obs = new IntersectionObserver(eles => {
    for (const e of eles)
        e.target.shown = e.isIntersecting;
});
function findHighlight(text, highlight, ordinal) {
    if (!text)
        return;
    let match = highlight.exec(text);
    if (!match)
        return;
    const termIndex = ordinal % termMaxOrdinal;
    let working = text;
    const replacement = [];
    while (match) {
        const found = match[0];
        const before = document.createTextNode(working.substring(0, match.index));
        const hl = document.createElement('span');
        hl.textContent = found;
        hl.className = `term term-${termIndex}`;
        replacement.push(before, hl);
        working = working.substring(match.index + found.length);
        match = highlight.exec(working);
    }
    const after = document.createTextNode(working);
    replacement.push(after);
    return replacement;
}
function injectHighlight(element, highlight, ordinal) {
    if (!element.childNodes)
        return;
    for (const child of [...element.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) {
            const replace = findHighlight(child.textContent, highlight, ordinal);
            if (replace)
                child.replaceWith(...replace);
        }
        else
            injectHighlight(child, highlight, ordinal);
    }
}
function highlightKey(input) {
    if (!input || !(input.length > 0))
        return '';
    let hash = 0;
    for (const r of input) {
        const str = r.toString();
        for (let i = 0; i < str.length; i++)
            hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }
    if (hash < 0)
        hash *= -1;
    const result = hash.toString(16);
    if (result.length > 8)
        return result.substring(result.length - 8);
    return result;
}
let PdfViewerPage = class PdfViewerPage extends LitElement {
    constructor() {
        super(...arguments);
        this.pageNumber = 1;
        this.zoom = 1;
    }
    static get styles() { return [styles, viewerCss, termStyle]; }
    render() {
        this.debouncePdfRender();
        return html `<canvas width="612" height="792"></canvas><div class="textLayer" @mouseup=${this.textSelected}></div></div>`;
    }
    get shown() { return this._shown; }
    ;
    set shown(s) {
        if (!s && !this._shown)
            return;
        if (s && this._shown)
            return;
        this._shown = s;
        if (s)
            this.debouncePdfRender();
    }
    ;
    connectedCallback() {
        obs.observe(this);
        super.connectedCallback();
    }
    disconnectedCallback() {
        obs.unobserve(this);
        super.disconnectedCallback();
    }
    async debouncePdfRender() {
        if (!this.shown)
            return;
        setTimeout(() => this.startRender(), 50);
    }
    async startRender() {
        if (!this.shown)
            return;
        if (!this.pdf)
            return;
        if (this.loading)
            await this.loading;
        while (!this.canvas)
            await new Promise(requestAnimationFrame);
        this.loading = this.renderPage(this.canvas, this.textLayer, this.pageNumber, this.highlight);
    }
    async renderPage(view, textLayer, pageNumber, highlight) {
        const renderKey = `${this.pdf.source} ${this.zoom} ${this.pageNumber}`;
        const regexKey = highlightKey(highlight);
        const renderChanged = renderKey !== this.lastRenderContent;
        const regexChanged = regexKey !== this.lastRenderHighlight;
        if (renderChanged) {
            clearCanvas(view);
            clearDom(textLayer);
        }
        else if (regexChanged)
            clearDom(textLayer);
        else
            return;
        this.classList.add('loading');
        if (!this.api)
            this.api = await pdfApi();
        console.time(`📃 Rendering page ${renderKey} ${regexKey}`);
        try {
            const page = await this.pdf.document.getPage(pageNumber);
            const viewport = page.getViewport({ scale: this.zoom });
            if (renderChanged) {
                this.style.width = `${viewport.width}px`;
                this.style.height = `${viewport.height}px`;
                view.width = viewport.width;
                view.height = viewport.height;
                const context = view.getContext('2d');
                const renderContext = {
                    canvasContext: context, viewport,
                };
                await page.render(renderContext);
            }
            if (renderChanged || regexChanged) {
                const textContent = await page.getTextContent();
                await this.api.renderTextLayer({
                    enhanceTextSelection: true,
                    textContent,
                    container: textLayer,
                    viewport,
                    textDivs: [],
                });
                if (highlight && highlight.length > 0) {
                    await new Promise(requestAnimationFrame);
                    for (let i = 0; i < highlight.length; i++)
                        injectHighlight(textLayer, highlight[i], i);
                }
            }
            if (renderChanged)
                this.lastRenderContent = renderKey;
            if (regexChanged)
                this.lastRenderHighlight = regexKey;
        }
        catch (ex) {
            clearCanvas(view);
            clearDom(textLayer);
            throw ex;
        }
        finally {
            this.loading = undefined;
            this.classList.remove('loading');
            console.timeEnd(`📃 Rendering page ${renderKey} ${regexKey}`);
        }
    }
    textSelected(e) {
        const selection = document.getSelection();
        if (!selection)
            return;
        const selectedText = selection.toString();
        if (selectedText && selectedText.length > 0)
            this.dispatchEvent(new CustomEvent('text-selection', {
                detail: { selection: selectedText, page: this.pageNumber },
                bubbles: true,
                composed: true
            }));
    }
};
__decorate([
    property({ type: Number, attribute: 'page' })
], PdfViewerPage.prototype, "pageNumber", void 0);
__decorate([
    property({ type: Number })
], PdfViewerPage.prototype, "zoom", void 0);
__decorate([
    property()
], PdfViewerPage.prototype, "highlight", void 0);
__decorate([
    property()
], PdfViewerPage.prototype, "pdf", void 0);
__decorate([
    query('div')
], PdfViewerPage.prototype, "textLayer", void 0);
__decorate([
    query('canvas')
], PdfViewerPage.prototype, "canvas", void 0);
__decorate([
    eventOptions({ capture: false })
], PdfViewerPage.prototype, "textSelected", null);
PdfViewerPage = __decorate([
    customElement('pdf-viewer-page')
], PdfViewerPage);
export { PdfViewerPage };
//# sourceMappingURL=pdf-viewer-page.js.map