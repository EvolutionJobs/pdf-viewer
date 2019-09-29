﻿var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, property, customElement, query } from '../../lib/lit-element/lit-element.js';
import { pdfApi } from './pdf-utility.js';
import './pdf-viewer-page.js';
const styles = css `
:host {
    position: relative;
    display: flex;
    background: var(--pdf-background, #888);
    flex-direction: column;
    overflow: hidden;
    min-height: 200px;
}

#container {
    flex: 1;
    overflow: auto;
    position: relative;
}

.viewer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    box-sizing: border-box;
    padding-left: var(--pdf-page-margin, 12px);
    padding-top: var(--pdf-page-margin, 12px);
}`;
const minZoom = .5;
function* normaliseSearchTerms(input) {
    if (typeof input === 'string')
        yield new RegExp(input, 'gi');
    else if (input instanceof RegExp)
        yield input;
    else
        for (const i of input)
            if (typeof i === 'string')
                yield new RegExp(i, 'gi');
            else if (i instanceof RegExp)
                yield i;
}
let PdfViewerDocument = class PdfViewerDocument extends LitElement {
    constructor() {
        super(...arguments);
        this.fit = 'height';
        this.zoomRatio = 1.25;
        this._zoom = 1;
    }
    static get styles() { return [styles]; }
    render() {
        const pages = this.pages > 0 ? Array.apply(null, Array(this.pages)).map((_, n) => n + 1) : undefined;
        const pdf = this.pdfProxy ? {
            document: this.pdfProxy,
            source: this._src
        } : undefined;
        const hl = this.highlight ? [...normaliseSearchTerms(this.highlight)] : undefined;
        return html `
<div id="container">
    <div id="viewer" class="viewer">
        ${pages && this.pdfProxy ? pages.map(p => html `
        <pdf-viewer-page
            page=${p}
            zoom=${this._zoom}
            .highlight=${hl}
            .pdf=${pdf}></pdf-viewer-page>`) : ''}
    </div>
</div>`;
    }
    firstUpdated(changedProperties) {
        if (this._src)
            this.srcChanged(this._src);
    }
    get src() { return this._src; }
    ;
    set src(s) {
        if (this._src === s)
            return;
        this._src = s;
        this.srcChanged(this._src);
    }
    async srcChanged(src) {
        if (!this.container)
            return;
        this.pages = undefined;
        this.pdfProxy = undefined;
        if (!src || !navigator.onLine)
            return;
        this.dispatchEvent(new CustomEvent('pdf-document-loading', {
            detail: { src: src },
        }));
        const pdfjsLib = await pdfApi();
        try {
            const pdf = await pdfjsLib.getDocument(src);
            if (src !== this.src)
                return;
            this.pdfProxy = pdf;
            this.pages = this.pdfProxy.numPages;
            this.dispatchEvent(new CustomEvent('pdf-document-loaded', {
                detail: {
                    src: src,
                    pages: this.pages
                },
            }));
        }
        catch (x) {
            this.dispatchEvent(new CustomEvent('pdf-document-error', {
                detail: {
                    src: src,
                    message: x.message,
                    name: x.name
                },
            }));
            throw x;
        }
    }
    async updateFit(fitMode) {
        if (fitMode === 'width')
            this.fitWidth();
        else
            this.fitHeight();
    }
    async fitWidth() {
        this.fit = 'width';
        const page = await this.pdfProxy.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const rect = this.container.getBoundingClientRect();
        const width = Math.min(screen.width, window.innerWidth, rect.width);
        const zoom = (width - 24) / viewport.width;
        if (zoom === this._zoom)
            return;
        this._zoom = zoom;
    }
    async fitHeight() {
        this.fit = 'height';
        const page = await this.pdfProxy.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const rect = this.container.getBoundingClientRect();
        const height = Math.min(screen.height, window.innerHeight, rect.height);
        const zoom = (height - 24) / viewport.height;
        if (zoom === this._zoom)
            return;
        this._zoom = zoom;
    }
    zoomin() {
        this._zoom = this._zoom * this.zoomRatio;
    }
    zoomout() {
        this._zoom = Math.max(minZoom, this._zoom / this.zoomRatio);
    }
};
__decorate([
    property()
], PdfViewerDocument.prototype, "src", null);
__decorate([
    property({ reflect: true, type: Number })
], PdfViewerDocument.prototype, "pages", void 0);
__decorate([
    property()
], PdfViewerDocument.prototype, "fit", void 0);
__decorate([
    property({ attribute: 'zoom-ratio', type: Number })
], PdfViewerDocument.prototype, "zoomRatio", void 0);
__decorate([
    property({ type: Number })
], PdfViewerDocument.prototype, "_zoom", void 0);
__decorate([
    property()
], PdfViewerDocument.prototype, "highlight", void 0);
__decorate([
    query('#container')
], PdfViewerDocument.prototype, "container", void 0);
PdfViewerDocument = __decorate([
    customElement('pdf-viewer-document')
], PdfViewerDocument);
export { PdfViewerDocument };
//# sourceMappingURL=pdf-viewer-document.js.map