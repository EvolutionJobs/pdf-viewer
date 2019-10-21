import { LitElement, html, css, property, customElement, query, eventOptions } from 'lit-element';
import { PDFDocumentProxy, PDFRenderTask } from './pdf'; // Definitions only
import { pdfApi, PdfPageSize, firstPageSize } from './pdf-utility.js';
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

.viewer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    box-sizing: border-box;
    padding-left: var(--pdf-page-margin, 12px);
    padding-top: var(--pdf-page-margin, 12px);
}`;

/** Event detail for 'pdf-document-loading' event */
export interface PdfLoadingEventArgs {

    /** URI of the document about to be loaded. */
    src: string;
}

/** Event detail for 'pdf-document-loaded' event */
export interface PdfLoadedEventArgs {

    /** URI of the document successfully loaded. */
    src: string;

    /** Number of pages in the document. */
    pages: number;
}

/** Event detail for 'pdf-document-error' event */
export interface PdfLoadErrorEventArgs {

    /** URI of the document that couldn't be loaded. */
    src: string;

    /** Error message. */
    message: string;

    /** Name of error. */
    name: string;
}

/** Don't allow zooming out past this minimum. */
const minZoom = .5;

/** Promote simple searches (just strings) to the arrarys of regular expressions the page find supports.
 * @param input A string, a regular expression, or an array of either.
 * @generator yeilds regular expressions. */
export function* normaliseSearchTerms(input: string | RegExp | (string | RegExp)[]) {
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
 *  Lifecycle events:
 *      pdf-document-loading: when the source has changed and loading is starting.
 *      pdf-document-loaded: once the document has been successfully loaded (pages may still be rendering).
 *      pdf-document-error: if an error is encountered while loading the document.      
 *      
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
 *       --pdf-highlight-opacity, default .4, highlights appear over text with this opacity.
 * */
@customElement('pdf-viewer-document')
export class PdfViewerDocument extends LitElement {

    static get styles() { return [styles]; }

    render() {
        // Convert the number of pages into an array of [1,..., pages]
        const pages = this.pages > 0 ? Array.apply(null, Array(this.pages)).map((_, n) => n + 1) : undefined;

        const pdf: ParentPdfDocument = this.pdfProxy ? {
            document: this.pdfProxy,
            source: this._src
        } : undefined;

        const hl = this.highlight ? [...normaliseSearchTerms(this.highlight)] : undefined;

        return html`
<div id="container">
    <div id="viewer" class="viewer">
        ${pages && this.pdfProxy ? pages.map(p => html`
        <pdf-viewer-page
            page=${p}
            zoom=${this._zoom}
            .pageSize=${this.pageSize}
            .highlight=${hl}
            .pdf=${pdf}></pdf-viewer-page>`) : ''}
    </div>
</div>`;
    }

    firstUpdated(changedProperties: any) {
        if (this._src)
            this.srcChanged(this._src);
    }

    private _src: string;

    /** URL of the PDF file to display. */
    @property()
    get src(): string { return this._src; };
    set src(s: string) {
        if (this._src === s)
            return;

        this._src = s;
        this.srcChanged(this._src);
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

    private _zoom: number = 1;

    @property({ type: Number })
    get zoom(): number { return this._zoom; };
    set zoom(z: number) {
        if (this._zoom === z)
            return;

        if (this.pdfProxy) 
            firstPageSize(this.pdfProxy, z).then(p => {
                this.pageSize = p;
                this._zoom = z;
                this.requestUpdate('zoom');
            });
        else {
            this._zoom = z;
            this.requestUpdate('zoom');
        }
    }

    @property()
    highlight: string | RegExp | (string | RegExp)[];

    @query('#container')
    private container: HTMLDivElement;

    /** Internal PDF object. */
    private pdfProxy: PDFDocumentProxy;

    /** Optional estimate of page size based on first page */
    private pageSize: PdfPageSize;

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
        this.pages = undefined;
        this.pageSize = undefined;

        if (this.pdfProxy) {
            this.pdfProxy.destroy();
            this.pdfProxy = undefined;
        }

        if (!src || !navigator.onLine)
            return;

        // console.time(`📃 Loaded PDF ${src}`);
        this.dispatchEvent(new CustomEvent<PdfLoadingEventArgs>(
            'pdf-document-loading', {
                detail: { src: src },
                bubbles: true,
                composed: true
            }));

        // Loaded via <script> tag, create shortcut to access PDF.js exports.
        const pdfjsLib = await pdfApi();

        try {
            const loadingTask = pdfjsLib.getDocument(src);

            const pdf = await loadingTask.promise;

            if (src !== this.src)
                return; // src changed while we were loading

            this.pdfProxy = pdf;
            
            // Get the size of the first page and estimate rest from that
            this.pageSize = await firstPageSize(this.pdfProxy, this._zoom);

            this.pages = this.pdfProxy.numPages;

            this.dispatchEvent(new CustomEvent<PdfLoadedEventArgs>(
                'pdf-document-loaded', {
                    detail: {
                        src: src,
                        pages: this.pages
                    },
                    bubbles: true,
                    composed: true
                }));
        }
        catch (x) {
            this.dispatchEvent(new CustomEvent<PdfLoadErrorEventArgs>(
                'pdf-document-error', {
                    detail: {
                        src: src,
                        message: x.message,
                        name: x.name
                    },
                    bubbles: true,
                    composed: true
                }));

            throw x;
        }
        // finally { console.timeEnd(`📃 Loaded PDF ${src}`); }
    }

    async updateFit(fitMode: 'height' | 'width') {
        if (fitMode === 'width')
            this.fitWidth();
        else this.fitHeight();
    }

    /** Display the document full width */
    private async fitWidth() {
        this.fit = 'width';

        const viewport = await firstPageSize(this.pdfProxy, 1); // Get page with no scaling
        const rect = this.container.getBoundingClientRect();
        // Avoid errors if element is allowed to stretch past screen boundary
        const width = Math.min(screen.width, window.innerWidth, rect.width);

        const zoom = (width - 24) / viewport.width;
        if (zoom === this._zoom)
            return;

        this.pageSize = await firstPageSize(this.pdfProxy, zoom);
        this._zoom = zoom;
        this.requestUpdate('zoom');
    }

    /** Display the whole page */
    private async fitHeight() {
        this.fit = 'height';

        const viewport = await firstPageSize(this.pdfProxy, 1); // Get page with no scaling
        const rect = this.container.getBoundingClientRect();
        // Avoid errors if element is allowed to stretch past screen boundary
        const height = Math.min(screen.height, window.innerHeight, rect.height);

        const zoom = (height - 24) / viewport.height;
        if (zoom === this._zoom)
            return;

        this.pageSize = await firstPageSize(this.pdfProxy, zoom);
        this._zoom = zoom;
        this.requestUpdate('zoom');
    }

    /** Zoom in */
    zoomin() {
        this.zoom = this._zoom * this.zoomRatio;
    }

    /** Zoom out */
    zoomout() {
        this.zoom = Math.max(minZoom, this._zoom / this.zoomRatio);
    }
}