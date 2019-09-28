import { LitElement, html, css, property, customElement, query, eventOptions } from '../../lib/lit-element/lit-element.js';
//import '../../lib/pdfjs-dist/build/pdf.worker.min.js';
//import '../../lib/pdfjs-dist/build/pdf.js';
import { PDFDocumentProxy, PDFRenderTask } from './pdf'; // Definitions only
import '../../lib/@polymer/paper-spinner/paper-spinner.js';
import { PaperSpinnerElement } from '../../lib/@polymer/paper-spinner/paper-spinner';
import { pdfApi } from './pdf-utility.js';

const styles = css`
:host {
    position: relative;
    display: inline-block;
    background: var(--pdf-paper, #fff);
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
`;

/** Import into constructible stylesheet from lib/pdfjs-dist/web/pdf_viewer.css
 *  These styles are set by pdf.js in the text overlay component. */
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
    }`;

/** Represent the parent document this is a page of */
export interface ParentPdfDocument {
    /** The parsed document proxy */
    document: PDFDocumentProxy;

    /** The source the PDF was loaded from. */
    source: string;
}


/** Clear the content of a canvas element
 * @param canvas The canvas to clear */
function clearCanvas(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
}

function clearDom(parent: HTMLElement) {
    const kids = parent.childNodes;
    while (kids && kids.length > 0)
        parent.removeChild(kids[kids.length - 1]);
}

/** Intersection observer used to see if a page is visible */
const obs = new IntersectionObserver(eles => {
    for (const e of eles)
        (e.target as any).shown = e.isIntersecting;
});

function injectHighlight(element: ChildNode, highlight: RegExp) {
    if (element.childNodes)
        for (const child of [...element.childNodes]) {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent;
                const match = highlight.exec(text);
                if (match) {
                    const found = match[0];
                    const before = document.createTextNode(text.substring(0, match.index));
                    const hl = document.createElement('span');
                    hl.textContent = found;
                    hl.className = 'highlight';
                    const after = document.createTextNode(text.substring(match.index + found.length));

                    child.replaceWith(before, hl, after);
                }
            }
            else injectHighlight(child, highlight);
        }
}

@customElement('pdf-viewer-page')
export class PdfViewerPage extends LitElement {
    static get styles() {
        return [styles, viewerCss];
    }

    render() {
        this.debouncePdfRender();

        return html`
<canvas width="612" height="792"></canvas>
<div class="textLayer"></div></div>`;
    }

    /** The page number to display.
     * The first page is 1 */
    @property({ type: Number, attribute: 'page' })
    pageNumber: number = 1;

    @property({ type: Number })
    zoom: number = 1;

    @property()
    highlight: string;

    _shown: boolean;
    get shown(): boolean { return this._shown; };
    set shown(s: boolean) {
        if (!s && !this._shown)
            return; // both falsey, no change

        if (s && this._shown)
            return; // both truthy, not change

        this._shown = s;
        if (s) this.debouncePdfRender(); // If true queue a render
    };

    /** Internal PDF object, can't be passed as attribute */
    @property()
    pdf: ParentPdfDocument;

    @query('div')
    private textLayer: HTMLDivElement;

    @query('canvas')
    private canvas: HTMLCanvasElement;

    private loading: Promise<void>;

    /** The cached API used to render. */
    private api?: any;

    connectedCallback() {
        obs.observe(this);
        super.connectedCallback();
    }

    disconnectedCallback() {
        // Deactivate this so if intersecting while removed it stops
        obs.unobserve(this);
        super.disconnectedCallback();
    }

    /** If visible queue the PDF render, with a debounce */
    private async debouncePdfRender() {
        if (!this.shown)
            return;

        setTimeout(() => this.startRender(), 50);
    }

    private async startRender() {
        if (!this.shown)
            return;

        // If already rendering wait for it to finish (we can't cancel)
        if (this.loading)
            await this.loading;

        // If the canvas hasn't been rendered yet wait for it
        while (!this.canvas)
            await new Promise(requestAnimationFrame);

        this.loading = this.renderPage(this.canvas, this.textLayer, this.pageNumber, this.highlight);
    }

    private async renderPage(view: HTMLCanvasElement, textLayer: HTMLDivElement, pageNumber: number, highlight: string) {
        
        clearCanvas(view);      // clear the canvas
        clearDom(textLayer);    // clear the text overlay

        if (!this.pdf) return;  // No PDF to render
        if (!this.api) this.api = await pdfApi(); // First time await getting the API

        console.time(`Rendering page ${pageNumber}`);

        try {
            // Get the page from the document
            const page = await this.pdf.document.getPage(pageNumber);

            // Render the page to a canvas image
            const viewport = page.getViewport({ scale: this.zoom });
            view.width = viewport.width;
            view.height = viewport.height;
            const context = view.getContext('2d');
            const renderContext = {
                canvasContext: context, viewport,
            };

            await page.render(renderContext);

            // Render the text overlay for selection and highlighting
            const textContent = await page.getTextContent();
            await this.api.renderTextLayer({
                enhanceTextSelection: true,
                textContent,
                container: textLayer,
                viewport,
                textDivs: [],
            });

            // Wait a frame for the DOM to update 
            await new Promise(requestAnimationFrame);
            const hl = new RegExp(highlight, 'gi');
            injectHighlight(textLayer, hl);
        }
        catch (ex) {
            const context = view.getContext('2d');
            context.clearRect(0, 0, view.width, view.height);
            throw ex;
        }
        finally { this.loading = undefined; }

        console.timeEnd(`Rendering page ${pageNumber}`);
    }
}