var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, property, customElement, query } from '../../lib/lit-element/lit-element.js';
import '../../lib/@polymer/paper-spinner/paper-spinner.js';
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

canvas {
    display: block;
    margin: 0;
}

    canvas:first-of-type {
        border-right: 1px solid lightgray;
    }

paper-spinner {
    position: absolute;
    width: 100px;
    height: 100px;
    top: calc( 50% - 50px);
    left: calc( 50% - 50px);
}

.viewer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    box-sizing: border-box;
    padding-left: var(--pdf-page-margin, 12px);
    padding-top: var(--pdf-page-margin, 12px);
}

[hidden] {
    display: none;
}

.yellow-btn {
    text-transform: none;
    color: #eeff41;
}
`;
const viewerCss = css `
.textLayer {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    opacity: 0.2;
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
    }


.annotationLayer section {
    position: absolute;
}

.annotationLayer .linkAnnotation > a,
.annotationLayer .buttonWidgetAnnotation.pushButton > a {
  position: absolute;
  font-size: 1em;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.annotationLayer .linkAnnotation > a:hover,
.annotationLayer .buttonWidgetAnnotation.pushButton > a:hover {
  opacity: 0.2;
  background: #ff0;
  box-shadow: 0px 2px 10px #ff0;
}

.annotationLayer .textAnnotation img {
  position: absolute;
  cursor: pointer;
}

.annotationLayer .textWidgetAnnotation input,
.annotationLayer .textWidgetAnnotation textarea,
.annotationLayer .choiceWidgetAnnotation select,
.annotationLayer .buttonWidgetAnnotation.checkBox input,
.annotationLayer .buttonWidgetAnnotation.radioButton input {
  background-color: rgba(0, 54, 255, 0.13);
  border: 1px solid transparent;
  box-sizing: border-box;
  font-size: 9px;
  height: 100%;
  margin: 0;
  padding: 0 3px;
  vertical-align: top;
  width: 100%;
}

.annotationLayer .choiceWidgetAnnotation select option {
  padding: 0;
}

.annotationLayer .buttonWidgetAnnotation.radioButton input {
  border-radius: 50%;
}

.annotationLayer .textWidgetAnnotation textarea {
  font: message-box;
  font-size: 9px;
  resize: none;
}

.annotationLayer .textWidgetAnnotation input[disabled],
.annotationLayer .textWidgetAnnotation textarea[disabled],
.annotationLayer .choiceWidgetAnnotation select[disabled],
.annotationLayer .buttonWidgetAnnotation.checkBox input[disabled],
.annotationLayer .buttonWidgetAnnotation.radioButton input[disabled] {
  background: none;
  border: 1px solid transparent;
  cursor: not-allowed;
}

.annotationLayer .textWidgetAnnotation input:hover,
.annotationLayer .textWidgetAnnotation textarea:hover,
.annotationLayer .choiceWidgetAnnotation select:hover,
.annotationLayer .buttonWidgetAnnotation.checkBox input:hover,
.annotationLayer .buttonWidgetAnnotation.radioButton input:hover {
  border: 1px solid #000;
}

.annotationLayer .textWidgetAnnotation input:focus,
.annotationLayer .textWidgetAnnotation textarea:focus,
.annotationLayer .choiceWidgetAnnotation select:focus {
  background: none;
  border: 1px solid transparent;
}

.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before,
.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after,
.annotationLayer .buttonWidgetAnnotation.radioButton input:checked:before {
  background-color: #000;
  content: '';
  display: block;
  position: absolute;
}

.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before,
.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after {
  height: 80%;
  left: 45%;
  width: 1px;
}

.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:before {
  -webkit-transform: rotate(45deg);
          transform: rotate(45deg);
}

.annotationLayer .buttonWidgetAnnotation.checkBox input:checked:after {
  -webkit-transform: rotate(-45deg);
          transform: rotate(-45deg);
}

.annotationLayer .buttonWidgetAnnotation.radioButton input:checked:before {
  border-radius: 50%;
  height: 50%;
  left: 30%;
  top: 20%;
  width: 50%;
}

.annotationLayer .textWidgetAnnotation input.comb {
  font-family: monospace;
  padding-left: 2px;
  padding-right: 0;
}

.annotationLayer .textWidgetAnnotation input.comb:focus {
  /*
   * Letter spacing is placed on the right side of each character. Hence, the
   * letter spacing of the last character may be placed outside the visible
   * area, causing horizontal scrolling. We avoid this by extending the width
   * when the element has focus and revert this when it loses focus.
   */
  width: 115%;
}

.annotationLayer .buttonWidgetAnnotation.checkBox input,
.annotationLayer .buttonWidgetAnnotation.radioButton input {
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  padding: 0;
}

.annotationLayer .popupWrapper {
  position: absolute;
  width: 20em;
}

.annotationLayer .popup {
  position: absolute;
  z-index: 200;
  max-width: 20em;
  background-color: #FFFF99;
  box-shadow: 0px 2px 5px #333;
  border-radius: 2px;
  padding: 0.6em;
  margin-left: 5px;
  cursor: pointer;
  font: message-box;
  word-wrap: break-word;
}

.annotationLayer .popup h1 {
  font-size: 1em;
  border-bottom: 1px solid #000000;
  margin: 0;
  padding-bottom: 0.2em;
}

.annotationLayer .popup p {
  margin: 0;
  padding-top: 0.2em;
}

.annotationLayer .highlightAnnotation,
.annotationLayer .underlineAnnotation,
.annotationLayer .squigglyAnnotation,
.annotationLayer .strikeoutAnnotation,
.annotationLayer .lineAnnotation svg line,
.annotationLayer .squareAnnotation svg rect,
.annotationLayer .circleAnnotation svg ellipse,
.annotationLayer .polylineAnnotation svg polyline,
.annotationLayer .polygonAnnotation svg polygon,
.annotationLayer .inkAnnotation svg polyline,
.annotationLayer .stampAnnotation,
.annotationLayer .fileAttachmentAnnotation {
  cursor: pointer;
}

.pdfViewer .canvasWrapper {
  overflow: hidden;
}

.pdfViewer .page {
  direction: ltr;
  width: 816px;
  height: 1056px;
  margin: 1px auto -8px auto;
  position: relative;
  overflow: visible;
  border: 9px solid transparent;
  background-clip: content-box;
  -o-border-image: url(images/shadow.png) 9 9 repeat;
     border-image: url(images/shadow.png) 9 9 repeat;
  background-color: white;
}

.pdfViewer.removePageBorders .page {
  margin: 0px auto 10px auto;
  border: none;
}

.pdfViewer.singlePageView {
  display: inline-block;
}

.pdfViewer.singlePageView .page {
  margin: 0;
  border: none;
}

.pdfViewer.scrollHorizontal, .pdfViewer.scrollWrapped, .spread {
  margin-left: 3.5px;
  margin-right: 3.5px;
  text-align: center;
}

.pdfViewer.scrollHorizontal, .spread {
  white-space: nowrap;
}

.pdfViewer.removePageBorders,
.pdfViewer.scrollHorizontal .spread,
.pdfViewer.scrollWrapped .spread {
  margin-left: 0;
  margin-right: 0;
}

.spread .page,
.pdfViewer.scrollHorizontal .page,
.pdfViewer.scrollWrapped .page,
.pdfViewer.scrollHorizontal .spread,
.pdfViewer.scrollWrapped .spread {
  display: inline-block;
  vertical-align: middle;
}

.spread .page,
.pdfViewer.scrollHorizontal .page,
.pdfViewer.scrollWrapped .page {
  margin-left: -3.5px;
  margin-right: -3.5px;
}

.pdfViewer.removePageBorders .spread .page,
.pdfViewer.removePageBorders.scrollHorizontal .page,
.pdfViewer.removePageBorders.scrollWrapped .page {
  margin-left: 5px;
  margin-right: 5px;
}

.pdfViewer .page canvas {
  margin: 0;
  display: block;
}

.pdfViewer .page canvas[hidden] {
  display: none;
}

.pdfViewer .page .loadingIcon {
  position: absolute;
  display: block;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: url('images/loading-icon.gif') center no-repeat;
}

.pdfPresentationMode .pdfViewer {
  margin-left: 0;
  margin-right: 0;
}

.pdfPresentationMode .pdfViewer .page,
.pdfPresentationMode .pdfViewer .spread {
  display: block;
}

.pdfPresentationMode .pdfViewer .page,
.pdfPresentationMode .pdfViewer.removePageBorders .page {
  margin-left: auto;
  margin-right: auto;
}

.pdfPresentationMode:-ms-fullscreen .pdfViewer .page {
  margin-bottom: 100% !important;
}

.pdfPresentationMode:-webkit-full-screen .pdfViewer .page {
  margin-bottom: 100%;
  border: 0;
}

.pdfPresentationMode:-moz-full-screen .pdfViewer .page {
  margin-bottom: 100%;
  border: 0;
}

.pdfPresentationMode:fullscreen .pdfViewer .page {
  margin-bottom: 100%;
  border: 0;
}`;
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
let PdfViewer = class PdfViewer extends LitElement {
    constructor() {
        super(...arguments);
        this.fit = 'height';
        this.zoomRatio = 1.25;
        this._views = 1;
        this._pos = ({ x: 0, y: 0 });
        this._zoom = 1;
    }
    static get styles() { return [styles, viewerCss]; }
    render() {
        const pages = this.pages > 0 ? Array.apply(null, Array(this.pages)).map((_, n) => n + 1) : undefined;
        const pdf = this._PDF ? {
            document: this._PDF,
            source: this._src
        } : undefined;
        const hl = [...normaliseSearchTerms(this.highlight)];
        return html `
<div id="container" 
    @track=${this._handleTrack}>
    <div id="viewer" class="viewer">
        ${pages && this._PDF ? pages.map(p => html `
        <pdf-viewer-page
            page=${p}
            zoom=${this._zoom}
            .highlight=${hl}
            .pdf=${pdf}></pdf-viewer-page>`) : html `
        <paper-spinner id="spinner" active></paper-spinner>`}
    </div>
</div>`;
    }
    firstUpdated(changedProperties) {
        if (this._src)
            this._srcChanged(this._src);
    }
    get src() { return this._src; }
    ;
    set src(s) {
        if (this._src === s)
            return;
        this._src = s;
        this._srcChanged(this._src);
    }
    get page() { return this._page; }
    ;
    set page(p) {
        if (this._page === p)
            return;
        const validated = p > this.pages ? this.pages : p < 1 ? 1 : p;
        if (this._page === validated)
            return;
        this._page = validated;
    }
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('iron-resize', this._recenter);
    }
    _clearView(view) {
        const context = view.getContext('2d');
        context.clearRect(0, 0, view.width, view.height);
    }
    async _srcChanged(src) {
        if (!this.container)
            return;
        this._loaded = false;
        this._page = undefined;
        this.pages = undefined;
        this._PDF = undefined;
        if (!src || !navigator.onLine)
            return;
        this._firstRender = false;
        try {
            const pdfjsLib = await pdfApi();
            const pdf = await pdfjsLib.getDocument(src);
            this._PDF = pdf;
        }
        catch (ex) {
            console.error(ex);
            throw ex;
        }
        if (src !== this.src)
            return;
        this._loaded = true;
        this.pages = this._PDF.numPages;
        this.page = 1;
        this.dispatchEvent(new CustomEvent('pdf-viewer-loaded', {
            detail: { src: src },
        }));
    }
    next() {
        if (this.page >= this.pages) {
            this.dispatchEvent(new CustomEvent('pdf-viewer-outrange'));
            return;
        }
        this.page += this._views;
        if (this.page > this.pages)
            this.page = this.pages;
    }
    previous() {
        if (this.page <= 1) {
            this.dispatchEvent(new CustomEvent('pdf-viewer-outrange'));
            return;
        }
        this.page -= this._views;
        if (this.page === 0)
            this.page = 1;
    }
    async updateFit(fitMode) {
        if (fitMode === 'width')
            this.fitWidth();
        else
            this.fitHeight();
    }
    async fitWidth() {
        const page = await this._PDF.getPage(this.page);
        let viewport = page.getViewport({ scale: 1 });
        let rect = this.container.getBoundingClientRect();
        const zoom = (rect.width - 20) / (this._views * viewport.width);
        if (zoom === this._zoom)
            return;
        this._zoom = zoom;
    }
    async fitHeight() {
        const pageNum = this.page || 1;
        const page = await this._PDF.getPage(this.page);
        let viewport = page.getViewport({ scale: 1 });
        let rect = this.container.getBoundingClientRect();
        const zoom = Math.min((rect.width - 20) / (this._views * viewport.width), (rect.height - 20) / viewport.height);
        if (zoom === this._zoom)
            return;
        this._zoom = zoom;
        this.page = pageNum;
    }
    zoomin() {
        this._zoom = this._zoom * this.zoomRatio;
    }
    zoomout() {
        this._zoom = this._zoom / this.zoomRatio;
    }
    async _renderView(view, pg) {
        if (!this._loaded)
            return;
        try {
            const page = await this._PDF.getPage(pg);
            const viewport = page.getViewport({ scale: this._zoom });
            view.width = viewport.width;
            view.height = viewport.height;
            const context = view.getContext('2d');
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            await page.render(renderContext);
            const textContent = await page.getTextContent();
            const textLayerDiv = view.nextElementSibling;
            const pdfjsLib = await pdfApi();
            pdfjsLib.renderTextLayer({
                enhanceTextSelection: true,
                textContent,
                container: textLayerDiv,
                viewport,
                textDivs: [],
            });
        }
        catch (ex) {
            const context = view.getContext('2d');
            context.clearRect(0, 0, view.width, view.height);
            throw ex;
        }
    }
    _handleTrack(evt) {
        let tmp;
        const getDiff = (evt) => {
            return {
                x: this._trackPos.x - evt.detail.x,
                y: this._trackPos.y - evt.detail.y,
            };
        };
        switch (evt.detail.state) {
            case 'start':
                this._trackPos = {
                    x: evt.detail.x,
                    y: evt.detail.y,
                };
                break;
            case 'track':
                tmp = getDiff(evt);
                break;
            case 'end':
                tmp = getDiff(evt);
                this._pos.x = this._pos.x - tmp.x;
                this._pos.y = this._pos.y - tmp.y;
                this._recenter();
                break;
        }
    }
    _recenter() {
    }
};
__decorate([
    property()
], PdfViewer.prototype, "src", null);
__decorate([
    property({ reflect: true, type: Number })
], PdfViewer.prototype, "page", null);
__decorate([
    property({ reflect: true, type: Number })
], PdfViewer.prototype, "pages", void 0);
__decorate([
    property()
], PdfViewer.prototype, "fit", void 0);
__decorate([
    property({ attribute: 'zoom-ratio', type: Number })
], PdfViewer.prototype, "zoomRatio", void 0);
__decorate([
    property({ type: Number })
], PdfViewer.prototype, "_zoom", void 0);
__decorate([
    property()
], PdfViewer.prototype, "highlight", void 0);
__decorate([
    query('#container')
], PdfViewer.prototype, "container", void 0);
PdfViewer = __decorate([
    customElement('pdf-viewer')
], PdfViewer);
export { PdfViewer };
//# sourceMappingURL=pdf-viewer.js.map