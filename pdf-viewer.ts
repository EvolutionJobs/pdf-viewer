import { LitElement, html, css, property, customElement, query, eventOptions } from '../../lib/lit-element/lit-element.js';
import './pdf-viewer-document.js';
import { PdfViewerDocument } from './pdf-viewer-document';

const styles = css`
:host {
    display: block;
}`;

/** Render a PDF with basic UI.
 *  This makes assumptions about how the UI should look, use <pdf-viewer-document> directly for custom look and feel. */
@customElement('pdf-viewer')
export class PdfViewer extends LitElement {

    static get styles() { return [styles]; }

    render() {
        return html`
<div>
    <button @tap=${e => this.pdfDocument.zoomin()}>+</button>
    <button @tap=${e => this.pdfDocument.zoomout()}>-</button>
    <button @tap=${this.expandFull}>Expand</button>
</div>
<pdf-viewer-document src="https://www.w3.org/TR/1998/REC-html40-19980424/html40.pdf" .highlight=${[/html/gi, 'w3c']}></pdf-viewer-document>`;
    }

    /** URL of the PDF file to display. */
    @property()
    src: string;

    /** Terms to highlight */
    @property()
    highlight: string | RegExp | (string | RegExp)[];

    /** Document control used to render the PDF */
    @query('pdf-viewer-document')
    private pdfDocument: PdfViewerDocument;

    private expandFull() {
        const target = `${this.src}#toolbar=1`;
        window.open(target, '_blank');
    }
}