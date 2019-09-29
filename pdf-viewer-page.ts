import { LitElement, html, css, property, customElement, query, eventOptions } from '../../lib/lit-element/lit-element.js';
import { PDFDocumentProxy, PDFRenderTask } from './pdf'; // Definitions only
import { pdfApi } from './pdf-utility.js';

const styles = css`
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
    border-radius: 2px;
    padding: 0 2px;
    margin-left: -2px;
}

    .term.term-0 { background: var(--pdf-colour-1, #f00); }
    .term.term-1 { background: var(--pdf-colour-2, #0f0); }
    .term.term-2 { background: var(--pdf-colour-3, #00f); }
    .term.term-3 { background: var(--pdf-colour-4, #fd0); }
    .term.term-4 { background: var(--pdf-colour-5, #0fd); }
    .term.term-5 { background: var(--pdf-colour-6, #d0f); }
    .term.term-6 { background: var(--pdf-colour-7, #df0); }
    .term.term-7 { background: var(--pdf-colour-8, #0df); }`;

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

/** Hold the max number of terms that have defined styles, more than this loops. */
const termMaxOrdinal = 8;

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

/** Clear the content of a DOM element
 * @param parent The element to clear */
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

/** If no match, return undefined
 *  If one or more matches, return array of text and highlight nodes to replace the text with.
 * @param text The text to search.
 * @param highlight The regular expression to search for.
 * @param ordinal The ordinal to mark the term with.
 * @returns Array of nodes to replace text with, or nothing if none found. */
function findHighlight(text: string, highlight: RegExp, ordinal: number) {
    if (!text) return;  // Empty

    let match = highlight.exec(text);
    if (!match) return; // No match

    const termIndex = ordinal % termMaxOrdinal;

    let working = text;
    const replacement: Node[] = [];
    while (match) {
        const found = match[0];
        // Text before the match
        const before = document.createTextNode(working.substring(0, match.index));

        // The highlighted match
        const hl = document.createElement('span');
        hl.textContent = found;
        hl.className = `term term-${termIndex}`;
        replacement.push(before, hl);

        // Text after the match
        working = working.substring(match.index + found.length);

        // Look for another match against the remainder
        match = highlight.exec(working);
    }

    // Remaining text with no matches found
    const after = document.createTextNode(working);
    replacement.push(after);
    return replacement;
}

/** Replace text nodes that match a term with highlights.
 * @param element The element to inject highlights into.
 * @param highlight The regular expression to search for.
 * @param ordinal The ordinal for the highlight. */
function injectHighlight(element: ChildNode, highlight: RegExp, ordinal: number) {
    if (!element.childNodes)
        return;

    for (const child of [...element.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) {
            const replace = findHighlight(child.textContent, highlight, ordinal);
            if (replace)
                child.replaceWith(...replace);
        }
        else injectHighlight(child, highlight, ordinal);
    }
}

/** Render a single page of a PDF.
 *  Only intended for use in <pdf-viewer-document>, this relies on document proxy references being passed and cannot generate its own. */
@customElement('pdf-viewer-page')
export class PdfViewerPage extends LitElement {

    static get styles() { return [styles, viewerCss]; }

    render() {
        this.debouncePdfRender(); // Queue a rerender of the PDF to canvas

        return html`<canvas width="612" height="792"></canvas><div class="textLayer"></div></div>`;
    }

    /** The page number to display.
     * The first page is 1 */
    @property({ type: Number, attribute: 'page' })
    pageNumber: number = 1;

    @property({ type: Number })
    zoom: number = 1;

    /** Parent PDF normalises the patterns to search for, this can't be passed as attribute. */
    @property()
    highlight: RegExp[];

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

    /** Internal PDF object, can't be passed as attribute. */
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
        if (!this.shown) return;  // Not visible
        setTimeout(() => this.startRender(), 50); // Wait 50ms, so changes in quick succession don't queue renders
    }

    /** Start a new render, with a check that the page is visible and that any other render has finished */
    private async startRender() {
        if (!this.shown) return; // Not visible
        if (!this.pdf) return;   // No PDF to render

        // If already rendering wait for it to finish (we can't cancel)
        if (this.loading)
            await this.loading;

        // If the canvas hasn't been rendered yet wait for it
        while (!this.canvas)
            await new Promise(requestAnimationFrame);

        this.loading = this.renderPage(this.canvas, this.textLayer, this.pageNumber, this.highlight);
    }

    private async renderPage(view: HTMLCanvasElement, textLayer: HTMLDivElement, pageNumber: number, highlight: RegExp[]) {

        clearCanvas(view);      // clear the canvas
        clearDom(textLayer);    // clear the text overlay

        this.classList.add('loading');

        if (!this.api) this.api = await pdfApi(); // First time await getting the API

        console.time(`📃 Rendering page ${pageNumber}`);

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

            // Apply transparent highlights to the text overlay
            for (let i = 0; i < highlight.length; i++)
                injectHighlight(textLayer, highlight[i], i);
        }
        catch (ex) {
            const context = view.getContext('2d');
            context.clearRect(0, 0, view.width, view.height);
            throw ex;
        }
        finally {
            this.loading = undefined; // Always clear the loading promise
            this.classList.remove('loading');
        } 

        console.timeEnd(`📃 Rendering page ${pageNumber}`);
    }
}