import { LitElement, html, css, property, customElement, query, eventOptions } from '../../lib/lit-element/lit-element.js';
//import '../../lib/pdfjs-dist/build/pdf.worker.min.js';
//import '../../lib/pdfjs-dist/build/pdf.js';
import { PDFDocumentProxy, PDFRenderTask } from './pdf'; // Definitions only
import '../../lib/@polymer/paper-spinner/paper-spinner.js';
import { PaperSpinnerElement } from '../../lib/@polymer/paper-spinner/paper-spinner';
import { pdfApi } from './pdf-utility.js';
import  './pdf-viewer-page.js';
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

@customElement('pdf-viewer')
export class PdfViewer extends LitElement {

    static get styles() { return [styles, viewerCss]; }

    render() {
        // Convert the number of pages into an array of [1,..., pages]
        const pages = this.pages > 0 ? Array.apply(null, Array(this.pages)).map((_, n) => n + 1) : undefined;

        const pdf: ParentPdfDocument = this._PDF ? {
            document: this._PDF,
            source: this._src
        } : undefined;

        return html`
<div id="container" 
    @track=${this._handleTrack}>
    <div id="viewer" class="viewer">
        ${pages && this._PDF ? pages.map(p => html`
        <pdf-viewer-page
            page=${p}
            zoom=${this._zoom}
            highlight=${this.highlight}
            .pdf=${pdf}></pdf-viewer-page>`) : html`
        <paper-spinner id="spinner" active></paper-spinner>`}
    </div>
</div>`;
    }

    firstUpdated(changedProperties: any) {
        if (this._src)
            this._srcChanged(this._src);
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
        this._srcChanged(this._src);
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

    /** The view mode of the document.
     * - 'single': single page
     * - 'double': double page side by side */
    //@property()
    //get mode(): 'single' | 'double' { return this._mode; };
    //set mode(m: 'single' | 'double') {
    //    if (this._mode === m)
    //        return;

    //    this._mode = m;
    //    this._modeChanged(m);
    //}

    /** Number of pages visible at once and incremented with each step */
    private _views: 1 | 2 = 1;

    /** Internal PDF object. */
    private _PDF: PDFDocumentProxy;

    /** Indicates if the first rending has been done. */
    private _firstRender: boolean;

    /** While a page is rendering this will hold the page number. */
    private _pageRendering: number;

    /** If a page queues rendering this will hold the next page. */
    private _pageNumPending: number;

    private _trackPos: { x: number, y: number };

    private _pos: { x: number, y: number } = ({ x: 0, y: 0 });

    @property({ type: Number })
    private _zoom: number = 1;

    private _loaded: boolean;

    @property()
    highlight: string;

    @query('#container')
    private container: HTMLDivElement;

    //@query('#viewer')
    //private viewer: HTMLDivElement;

    //@query('#viewer1')
    //private page1canvas: HTMLCanvasElement;

    //@query('#viewer2')
    //private page2canvas: HTMLCanvasElement;

    //@query('#spinner')
    //private spinner: PaperSpinnerElement;

    //static get properties() {
    //    return {

    //        /**
    //         * import error message for translation
    //         */
    //        errorMessage: {
    //            type: String,
    //            value: 'Error loading the pdf file',
    //        },
    //        errorBtnLabel: {
    //            type: String,
    //            value: 'Close',
    //        },
    //    }
    //}

    //constructor() {
    //    super()
    //    this.PDFJS = pdfjsDistBuildPdf;
    //    this.PDFJS.GlobalWorkerOptions.workerSrc = this.PDFJS_workerSrc
    //}

    connectedCallback() {
        super.connectedCallback()
        this.addEventListener('iron-resize', this._recenter)
    }

    private _clearView(view: HTMLCanvasElement) {
        const context = view.getContext('2d')
        context.clearRect(0, 0, view.width, view.height)
    }

    /** When the source property is set render
     * @event pdf-viewer-loaded Fired when the download of the pdf succeed.
     * @param src the source string of the pdf. */
    private async _srcChanged(src: string) {

        if (!this.container)
            return; // not loaded yet, defer until it has

        this._loaded = false;

        // Clear the pages and document proxy
        this._page = undefined;
        this.pages = undefined;
        this._PDF = undefined;

        //// Reset the canvas elements
        //this.page2canvas.hidden = true;
        //this.page1canvas.hidden = true;
        //this._clearView(this.page1canvas);
        //this._clearView(this.page2canvas);

        if (!src || !navigator.onLine)
            return;

        //this.spinner.active = true;

        this._firstRender = false;

        try {
            // Loaded via <script> tag, create shortcut to access PDF.js exports.
            const pdfjsLib = await pdfApi();

            const pdf = await pdfjsLib.getDocument(src);
            this._PDF = pdf;
        }
        catch (ex) {
            console.error(ex);
            throw ex;
        }

        if (src !== this.src)
            return; // fake cancel

        this._loaded = true;

        this.pages = this._PDF.numPages;
        this.page = 1;

        //if (this.page > pdf.numPages)
        //    this.page = pdf.numPages;

        //if (this.page < 0)
        //    this.page = 1;

        //if (!this.page)
        //    this.page = 1;

        this.dispatchEvent(new CustomEvent<{ src: string }>(
            'pdf-viewer-loaded', {
                detail: { src: src },
            }))

        //this.updateFit(this.fit);

        //this.PDFJS.getDocument(src)
    }

    //_modeChanged(mode: 'single' | 'double') {
    //    if (mode === 'double') {
    //        this._views = 2;
    //        this.page2canvas.hidden = false;
    //    }
    //    else {
    //        this._views = 1;
    //        this.page2canvas.hidden = true;
    //    }

    //    // Modes changed, so recalc fit and centre
    //    this._recenter();
    //    this.updateFit(this.fit);
    //}

    /** Move to the next page.
     * @event pdf-viewer-outrange Fired when trying to render a non existing page. */
    next() {
        if (this.page >= this.pages) {
            this.dispatchEvent(new CustomEvent('pdf-viewer-outrange'));
            return;
        }

        this.page += this._views;

        if (this.page > this.pages)
            this.page = this.pages;
    }

    /** Move to the previous page.
     * @event pdf-viewer-outrange Fired when trying to render a non existing page. */
    previous() {
        if (this.page <= 1) {
            this.dispatchEvent(new CustomEvent('pdf-viewer-outrange'));
            return;
        }

        this.page -= this._views;

        if (this.page === 0)
            this.page = 1;
    }

    private async updateFit(fitMode: 'height' | 'width') {
        if (fitMode === 'width')
            this.fitWidth();
        else this.fitHeight();
    }

    /** Display the document full width */
    private async fitWidth() {
        const page = await this._PDF.getPage(this.page);

        let viewport = page.getViewport({ scale: 1 });
        let rect = this.container.getBoundingClientRect();

        const zoom = (rect.width - 20) / (this._views * viewport.width);
        if (zoom === this._zoom)
            return;

        this._zoom = zoom;
        //this._drawPage();
    }

    /** Display the whole page */
    private async fitHeight() {
        const pageNum = this.page || 1;
        const page = await this._PDF.getPage(this.page);

        let viewport = page.getViewport({ scale: 1 });
        let rect = this.container.getBoundingClientRect();

        const zoom = Math.min((rect.width - 20) / (this._views * viewport.width), (rect.height - 20) / viewport.height);
        if (zoom === this._zoom)
            return;

        this._zoom = zoom;
        this.page = pageNum;
        //this._drawPage();
    }

    /** Zoom in */
    zoomin() {
        this._zoom = this._zoom * this.zoomRatio;
        //this._drawPage();
    }

    /** Zoom out */
    zoomout() {
        this._zoom = this._zoom / this.zoomRatio;
        //this._drawPage();
    }

    private async _renderView(view: HTMLCanvasElement, pg: number) {
        if (!this._loaded)
            return;

        try {
            const page = await this._PDF.getPage(pg);

            //

            //console.log('Lines on page', text);


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
            //document.createElement("div");
            //textLayerDiv.setAttribute("class", "textLayer");

            const pdfjsLib = await pdfApi();

            pdfjsLib.renderTextLayer({
                enhanceTextSelection: true,
                textContent,
                container: textLayerDiv,
                viewport,
                textDivs: [],
            });


            //view.parentElement.appendChild(textLayerDiv);

            //for (const item of text.items) {
            //    item.str.match(/html/gi);
            //}
        }
        catch (ex) {
            const context = view.getContext('2d');
            context.clearRect(0, 0, view.width, view.height);
            throw ex;
        }
    }

    /**
     * @event pdf-viewer-render Fired when a page have been rendered.
     * @param pg the endered page number. */
    //private async _drawPage(pg?: number) {
    //    if (!this._loaded)
    //        return;

    //    if (!pg || isNaN(pg))
    //        pg = this.page;

    //    if (this._pageRendering > 0) {
    //        // Another page is rendering, request this page to be next (may be overwritten and skipped)
    //        this._pageNumPending = pg
    //        return;
    //    }

    //    try {
    //        // Block other renders and set this as the active render
    //        this._pageRendering = pg;
    //        this.spinner.active = true;

    //        const promises: Promise<any>[] = [];
    //        if (this.mode === 'single') {
    //            this.page1canvas.hidden = false;
    //            promises.push(this._renderView(this.page1canvas, pg))
    //        } else {
    //            this.page2canvas.hidden = false
    //            this.page1canvas.hidden = false
    //            promises.push(this._renderView(this.page1canvas, pg - pg % 2))
    //            promises.push(this._renderView(this.page2canvas, pg - pg % 2 + 1))
    //        }

    //        await Promise.all(promises);

    //        this._firstRender = true;
    //    }
    //    finally {
    //        // Always release the block on rendering
    //        this._pageRendering = undefined;
    //        this.spinner.active = false;
    //    }

    //    this._recenter();

    //    this.dispatchEvent(new CustomEvent<{ page: number }>('pdf-viewer-render', { detail: { page: this.page } }));

    //    if (this._pageNumPending > 0) {
    //        // One or more draw requests came in while this was rendering, so call again
    //        const p = this._pageNumPending;
    //        this._pageNumPending = undefined;
    //        await this._drawPage(p);
    //    }
    //}

    private _handleTrack(evt: CustomEvent<{ x: number, y: number, state: 'start' | 'track' | 'end' }>) {
        let tmp
        const getDiff = (evt: CustomEvent<{ x: number, y: number }>) => {
            return {
                x: this._trackPos.x - evt.detail.x,
                y: this._trackPos.y - evt.detail.y,
            }
        }

        switch (evt.detail.state) {
            case 'start':
                this._trackPos = {
                    x: evt.detail.x,
                    y: evt.detail.y,
                };
                break;

            case 'track':
                tmp = getDiff(evt);
                //  this.viewer.style.transform = `translateX(${this._pos.x - tmp.x}px) translateY(${this._pos.y - tmp.y}px)`;
                break;

            case 'end':
                tmp = getDiff(evt);
                this._pos.x = this._pos.x - tmp.x;
                this._pos.y = this._pos.y - tmp.y;
                this._recenter();
                break;
        }
    }

    private _recenter() {
        //if (!this.container || !this.viewer)
        //    return;

        //const rect = this.container.getBoundingClientRect();
        //const viewerRect = this.viewer.getBoundingClientRect();

        //if (rect.width > viewerRect.width)
        //    this._pos.x = (rect.width - viewerRect.width) / 2;

        //if (rect.height > viewerRect.height)
        //    this._pos.y = (rect.height - viewerRect.height) / 2;

        //if (rect.width < viewerRect.width &&
        //    rect.width > viewerRect.width + this._pos.x + 50)
        //    this._pos.x = rect.width - 50 - viewerRect.width;

        //if (rect.width < viewerRect.width &&
        //    this._pos.x > 50)
        //    this._pos.x = 50;

        //if (rect.height < viewerRect.height &&
        //    rect.height > viewerRect.height + this._pos.y + 50)
        //    this._pos.y = rect.height - 50 - viewerRect.height;

        //if (rect.height < viewerRect.height &&
        //    this._pos.y > 50)
        //    this._pos.y = 50;

        //this.viewer.style.transform = `translateX(${this._pos.x}px) translateY(${this._pos.y}px)`;
    }
}