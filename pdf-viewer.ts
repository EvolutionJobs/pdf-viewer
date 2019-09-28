import { LitElement, html, css, property, customElement, query, eventOptions } from '../../lib/lit-element/lit-element.js';
import './pdf-viewer-document.js';
import { PdfViewerDocument } from './pdf-viewer-document';
import '../../lib/@polymer/paper-icon-button/paper-icon-button.js';
import '../../lib/@polymer/iron-icons/iron-icons.js';
import '../../lib/@polymer/paper-tooltip/paper-tooltip.js';
import { ifDefined } from '../../lib/lit-html/directives/if-defined.js';

const styles = css`
:host {
    display: flex;
    height: 100vh;
    overflow: hidden;
    position: relative;
}

#actions {
    display: none;
    position: absolute;
    bottom: 0;
    right: 24px;
    width: min-content;
    height: min-content;
}

    #actions.loaded {
        display: block;
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
`;

/** Render a PDF with basic UI.
 *  This makes assumptions about how the UI should look, use <pdf-viewer-document> directly for custom look and feel. */
@customElement('pdf-viewer')
export class PdfViewer extends LitElement {

    static get styles() { return [styles]; }

    render() {
        const fitIcon = this.fitMode === 'width' ? 'fullscreen-exit' : 'fullscreen';

        return html`
<pdf-viewer-document
    .src=${this.src} 
    .highlight=${this.highlight}
    @pdf-document-loading=${e => this.loaded = false}
    @pdf-document-loaded=${ e => this.loaded = true}></pdf-viewer-document>

<div id="actions" class=${ifDefined(this.loaded ? 'loaded' : undefined)}>
    <paper-icon-button icon="launch" id="actionExpand"
        @tap=${this.expandFull}></paper-icon-button>
    <paper-tooltip for="actionExpand" position="left" animation-delay="0">
        Open document in a new tab
    </paper-tooltip>

    <paper-icon-button icon=${fitIcon} id="actionFit"
        @tap=${this.toggleFit}></paper-icon-button>
    <paper-tooltip for="actionFit" position="left" animation-delay="0">
        Fit to one page ${this.fitMode === 'height' ? 'width' : 'height'}
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
</div>`;
    }

    /** URL of the PDF file to display. */
    @property()
    src: string;

    /** Terms to highlight */
    @property()
    highlight: string | RegExp | (string | RegExp)[];

    @property()
    private fitMode: 'height' | 'width' | 'custom';

    @property()
    private loaded: boolean;

    /** Document control used to render the PDF */
    @query('pdf-viewer-document')
    private pdfDocument: PdfViewerDocument;

    private expandFull() {
        const target = `${this.src}#toolbar=1`;
        window.open(target, '_blank');
    }

    private toggleFit() {
        const fit = this.fitMode === 'height' ? 'width' : 'height';
        this.fitMode = fit;
        this.pdfDocument.updateFit(fit);
    }

    private zoomin() {
        this.fitMode = 'custom';
        this.pdfDocument.zoomin()
    }

    private zoomout() {
        this.fitMode = 'custom';
        this.pdfDocument.zoomout()
    }
}