import { LitElement, html, css, property, customElement, query, eventOptions } from '../../lib/lit-element/lit-element.js';
import { PDFDocumentProxy, PDFRenderTask } from './pdf'; // Definitions only
import '../../lib/@polymer/paper-spinner/paper-spinner.js';
import { pdfApi } from './pdf-utility.js';
import './pdf-viewer-page.js';
import { ParentPdfDocument } from './pdf-viewer-page';

const styles = css`
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

/** Import into constructible stylesheet from lib/pdfjs-dist/web/pdf_viewer.css */
const viewerCss = css`
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

function* normaliseSearchTerms(input: string | RegExp | (string | RegExp)[]) {
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

/** Render a PDF document a canvas elements in the page.
 *  No UI provided, just display of the document.
 *  Each page is rendered by <pdf-viewer-page>, which uses an IntersectionObserver to only render visible pages.
 *  Styles: 
 *       --pdf-background, default: #888, content behind pages.
 *       --pdf-paper, default: #fff, colour of each page (overriden by canvas content).
 *       --pdf-colour-1, default: #f00, colour for 1st term highlight.
 *       --pdf-colour-2, default: #0f0, colour for 2nd term highlight.
 *       --pdf-colour-3, default: #00f, colour for 3rd term highlight.
 *       --pdf-colour-4, default: #fd0, colour for 4th term highlight.
 *       --pdf-colour-5, default: #0fd, colour for 5th term highlight.
 *       --pdf-colour-6, default: #d0f, colour for 6th term highlight.
 *       --pdf-colour-7, default: #df0, colour for 7th term highlight.
 *       --pdf-colour-8, default: #0df, colour for 8th term highlight. (subsequent terms repeat)
 * */
@customElement('pdf-viewer-document')
export class PdfViewerDocument extends LitElement {

    static get styles() { return [styles, viewerCss]; }

    render() {
        // Convert the number of pages into an array of [1,..., pages]
        const pages = this.pages > 0 ? Array.apply(null, Array(this.pages)).map((_, n) => n + 1) : undefined;

        const pdf: ParentPdfDocument = this._PDF ? {
            document: this._PDF,
            source: this._src
        } : undefined;

        const hl = [...normaliseSearchTerms(this.highlight)];

        return html`
<div id="container">
    <div id="viewer" class="viewer">
        ${pages && this._PDF ? pages.map(p => html`
        <pdf-viewer-page
            page=${p}
            zoom=${this._zoom}
            .highlight=${hl}
            .pdf=${pdf}></pdf-viewer-page>`) : html`
        <paper-spinner id="spinner" active></paper-spinner>`}
    </div>
</div>`;
    }

    firstUpdated(changedProperties: any) {
        if (this._src)
            this.srcChanged(this._src);
    }

    private _src: string;
    private _page: number;
    //  private _mode: 'single' | 'double' = 'single';

    /** URL of the PDF file to display. */
    @property()
    get src(): string { return this._src; };
    set src(s: string) {
        if (this._src === s)
            return;

        this._src = s;
        this.srcChanged(this._src);
    }

    /** The page number to display.
     * The first page is 1 */
    @property({ reflect: true, type: Number })
    get page(): number { return this._page; };
    set page(p: number) {
        if (this._page === p)
            return;

        // If past last page then last page, if less than 1 then 1, otherwise set
        const validated = p > this.pages ? this.pages : p < 1 ? 1 : p;
        if (this._page === validated)
            return;

        // If past last page then last page, if less than 1 then 1, otherwise set
        this._page = validated;
        //this._drawPage(this._page);
    }

    /** Total number of pages in the document, set by parsing the src. */
    @property({ reflect: true, type: Number })
    private pages: number;

    /** The initial zoom when opening a document and when the mode change.
     * - 'height': whole page
     * - 'width': full width */
    @property()
    fit: 'height' | 'width' = 'height';

    /** The zoom ratio used. */
    @property({ attribute: 'zoom-ratio', type: Number })
    zoomRatio: number = 1.25;

    /** Internal PDF object. */
    private _PDF: PDFDocumentProxy;


    private _trackPos: { x: number, y: number };

    private _pos: { x: number, y: number } = ({ x: 0, y: 0 });

    @property({ type: Number })
    private _zoom: number = 1;

    @property()
    highlight: string | RegExp | (string | RegExp)[];

    @query('#container')
    private container: HTMLDivElement;

    //connectedCallback() {
    //    super.connectedCallback()
    //    this.addEventListener('iron-resize', this._recenter)
    //}

    /** When the source property is set render
     * @event pdf-viewer-loaded Fired when the download of the pdf succeed.
     * @param src the source string of the pdf. */
    private async srcChanged(src: string) {

        if (!this.container)
            return; // not loaded yet, defer until it has

        // Clear the pages and document proxy
        this._page = undefined;
        this.pages = undefined;
        this._PDF = undefined;

        if (!src || !navigator.onLine)
            return;

        // Loaded via <script> tag, create shortcut to access PDF.js exports.
        const pdfjsLib = await pdfApi();

        const pdf = await pdfjsLib.getDocument(src);
        this._PDF = pdf;

        if (src !== this.src)
            return; // fake cancel

        this.pages = this._PDF.numPages;
        this.page = 1;

        this.dispatchEvent(new CustomEvent<{ src: string }>(
            'pdf-viewer-loaded', {
                detail: { src: src },
            }))
    }

    async updateFit(fitMode: 'height' | 'width') {
        if (fitMode === 'width')
            this.fitWidth();
        else this.fitHeight();
    }

    /** Display the document full width */
    private async fitWidth() {
        const page = await this._PDF.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const rect = this.container.getBoundingClientRect();
        // Avoid errors if element is allowed to stretch past screen boundary
        const width = Math.min(screen.width, window.innerWidth, rect.width); 

        const zoom = (width - 24) / viewport.width;
        if (zoom === this._zoom)
            return;

        this._zoom = zoom;
    }

    /** Display the whole page */
    private async fitHeight() {
        const pageNum = this.page || 1;
        const page = await this._PDF.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const rect = this.container.getBoundingClientRect();
        // Avoid errors if element is allowed to stretch past screen boundary
        const height = Math.min(screen.height, window.innerHeight, rect.height);

        const zoom =(height - 24) / viewport.height;
        if (zoom === this._zoom)
            return;

        this._zoom = zoom;
        this.page = pageNum;
    }

    /** Zoom in */
    zoomin() {
        this._zoom = this._zoom * this.zoomRatio;
    }

    /** Zoom out */
    zoomout() {
        this._zoom = this._zoom / this.zoomRatio;
    }
}