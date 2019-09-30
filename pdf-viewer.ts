import { LitElement, html, css, property, customElement, query, eventOptions } from '../../lib/lit-element/lit-element.js';
import './pdf-viewer-document.js';
import './plain-text.js';
import { PdfViewerDocument, PdfLoadErrorEventArgs, PdfLoadedEventArgs, PdfLoadingEventArgs } from './pdf-viewer-document';
import '../../lib/@polymer/paper-icon-button/paper-icon-button.js';
import '../../lib/@polymer/iron-icons/iron-icons.js';
import '../../lib/@polymer/paper-tooltip/paper-tooltip.js';
import '../../lib/@polymer/paper-spinner/paper-spinner.js';

const styles = css`
:host {
    display: flex;
    height: 100vh;
    overflow: hidden;
    position: relative;
}

pdf-viewer-document {
    flex: 1;
}

#actions {
    position: absolute;
    bottom: 0;
    right: 24px;
    width: min-content;
    height: min-content;
}

paper-icon-button {
    --iron-icon-height: 20px;
    --iron-icon-width: 20px;
    background-color: rgb(242, 242, 242);
    border-radius: 50%;
    color: var(--paper-grey-700);
    box-shadow:
        0 2px 2px 0 rgba(0, 0, 0, 0.14),
        0 1px 5px 0 rgba(0, 0, 0, 0.12),
        0 3px 1px -2px rgba(0, 0, 0, 0.2);
    display: block;
    margin: calc(var(--pdf-page-margin, 12px) * 2);
}

    paper-icon-button:hover {
        box-shadow: 
            0 4px 5px 0 rgba(0, 0, 0, 0.14),
            0 1px 10px 0 rgba(0, 0, 0, 0.12),
            0 2px 4px -1px rgba(0, 0, 0, 0.4);   
    }

paper-spinner {
    width: 100px;
    height: 100px;
}

.center-overlay {
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
}

h4 {
    color: var(--pdf-paper, #fff);
}

.fallback {
    padding: var(--pdf-page-margin, 12px);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: auto;
}`;

/** Render a PDF with basic UI.
 *  This makes assumptions about how the UI should look, use <pdf-viewer-document> directly for custom look and feel.
 *  UI elements can be overridden in 3 slots:
 *      actions: action buttons for zoom, fit and expand. Default is floating action buttons like Chrome's PDF viewer.
 *      error: message displayed when a document can't be loaded. Default displays the error message.
 *      loader: content displayed while a document is being retrieved. Default is a 100px paper-spinner. */
@customElement('pdf-viewer')
export class PdfViewer extends LitElement {

    static get styles() { return [styles]; }

    private renderActions(fitMode: 'height' | 'width' | 'custom') {
        const fitIcon = fitMode === 'width' ? 'fullscreen-exit' : 'fullscreen';

        return html`
<slot name="actions">
    <div id="actions">
        <paper-icon-button icon="launch" id="actionExpand"
            @tap=${this.expandFull}></paper-icon-button>
        <paper-tooltip for="actionExpand" position="left" animation-delay="0">
            Open document in a new tab
        </paper-tooltip>

        <paper-icon-button icon=${fitIcon} id="actionFit"
            @tap=${this.toggleFit}></paper-icon-button>
        <paper-tooltip for="actionFit" position="left" animation-delay="0">
            Fit to one page ${fitMode === 'height' ? 'width' : 'height'}
        </paper-tooltip>

        <paper-icon-button icon="zoom-in" id="actionZoomIn"
            @tap=${this.zoomin}></paper-icon-button>
        <paper-tooltip for="actionZoomIn" position="left" animation-delay="0">
            Zoom In
        </paper-tooltip>

        <paper-icon-button icon="zoom-out" id="actionZoomOut"
            @tap=${this.zoomout}></paper-icon-button>
        <paper-tooltip for="actionZoomOut" position="left" animation-delay="0">
            Zoom Out
        </paper-tooltip>
    </div>
</slot>`
    }

    private renderError(error: PdfLoadErrorEventArgs) {
        if (this.fallback)
            return html`
<div class="fallback">
    <slot name="error">
        <div>
            <h2>${this.loadError.name || 'Exception'}</h2>
            ${this.loadError.message}
        </div>
    </slot>
    <h4>Plain text fallback:</h4>
    <plain-text
        .text=${this.fallback}
        .highlight=${this.highlight}></plain-text>
</div>`;

        return html`
<div class="center-overlay">
    <slot name="error">
        <div>
            <h2>${this.loadError.name || 'Exception'}</h2>
            ${this.loadError.message}
        </div>
    </slot>
</div>`
    }

    private renderSpinner() {
        return html`
<div class="center-overlay">
    <slot name="loader">
        <paper-spinner active></paper-spinner>
    </slot>
</div>`
    }

    render() {

        return html`
<pdf-viewer-document
    .src=${this.src} 
    .highlight=${this.highlight}
    @pdf-document-loading=${this.pdfLoading}
    @pdf-document-loaded=${this.pdfLoaded}
    @pdf-document-error=${this.pdfLoadError}></pdf-viewer-document>

${this.loaded ?
                this.renderActions(this.fitMode) :
                this.loadError ?
                    this.renderError(this.loadError) :
                    this.renderSpinner()}`;
    }

    /** URL of the PDF file to display. */
    @property()
    src: string;

    /** Terms to highlight */
    @property()
    highlight: string | RegExp | (string | RegExp)[];

    /** Text content to render if the PDF fails to load. */
    @property()
    fallback: string;

    @property()
    private fitMode: 'height' | 'width' | 'custom';

    @property()
    private loaded: boolean;

    @property()
    private loadError: PdfLoadErrorEventArgs;

    /** Document control used to render the PDF */
    @query('pdf-viewer-document')
    private pdfDocument: PdfViewerDocument;

    /** Open the document in a new tab/window using the browser's native render. */
    @eventOptions({ capture: false, passive: true })
    expandFull() {
        const target = `${this.src}#toolbar=1`;
        window.open(target, '_blank');
    }

    /** Toggle fit mode: width of one page or height of one page.
     *  Calling this will reset zoom to fit by height of one page. */
    @eventOptions({ capture: false, passive: true })
    toggleFit() {
        const fit = this.fitMode === 'height' ? 'width' : 'height';
        this.fitMode = fit;
        this.pdfDocument.updateFit(fit);
    }

    /** Zoom in 1 step */
    @eventOptions({ capture: false, passive: true })
    zoomin() {
        this.fitMode = 'custom';
        this.pdfDocument.zoomin()
    }

    /** Zoom out 1 step */
    @eventOptions({ capture: false, passive: true })
    zoomout() {
        this.fitMode = 'custom';
        this.pdfDocument.zoomout()
    }

    @eventOptions({ capture: false, passive: true })
    private pdfLoading(e: CustomEvent<PdfLoadingEventArgs>) {
        this.loadError = undefined;
        this.loaded = false;
    }

    @eventOptions({ capture: false, passive: true })
    private pdfLoaded(e: CustomEvent<PdfLoadedEventArgs>) {
        this.loaded = true;
    }

    @eventOptions({ capture: false, passive: true })
    private pdfLoadError(e: CustomEvent<PdfLoadErrorEventArgs>) {
        this.loadError = e.detail;
    }
}