var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, property, customElement, query } from '../../lib/lit-element/lit-element.js';
import './pdf-viewer-document.js';
import '../../lib/@polymer/paper-icon-button/paper-icon-button.js';
import '../../lib/@polymer/iron-icons/iron-icons.js';
const styles = css `
:host {
    display: block;
    height: 100vh;
    overflow: auto;
    position: relative;
}

#actions {
    position: absolute;
    bottom: 0;
    right: 0;
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
let PdfViewer = class PdfViewer extends LitElement {
    static get styles() { return [styles]; }
    render() {
        const fitIcon = this.fitMode === 'width' ? 'fullscreen-exit' : 'fullscreen';
        return html `
<pdf-viewer-document
    .src=${this.src} 
    .highlight=${this.highlight}></pdf-viewer-document>

<div id="actions">
    <paper-icon-button icon=${fitIcon}
        @tap=${this.toggleFit}></paper-icon-button>
    <paper-icon-button icon="launch"
        @tap=${this.expandFull}></paper-icon-button>
    <paper-icon-button icon="zoom-in"
        @tap=${this.zoomin}></paper-icon-button>
    <paper-icon-button icon="zoom-out"
        @tap=${this.zoomout}></paper-icon-button>
</div>`;
    }
    expandFull() {
        const target = `${this.src}#toolbar=1`;
        window.open(target, '_blank');
    }
    toggleFit() {
        const fit = this.fitMode === 'height' ? 'width' : 'height';
        this.fitMode = fit;
        this.pdfDocument.updateFit(fit);
    }
    zoomin() {
        this.fitMode = 'custom';
        this.pdfDocument.zoomin();
    }
    zoomout() {
        this.fitMode = 'custom';
        this.pdfDocument.zoomout();
    }
};
__decorate([
    property()
], PdfViewer.prototype, "src", void 0);
__decorate([
    property()
], PdfViewer.prototype, "highlight", void 0);
__decorate([
    property()
], PdfViewer.prototype, "fitMode", void 0);
__decorate([
    query('pdf-viewer-document')
], PdfViewer.prototype, "pdfDocument", void 0);
PdfViewer = __decorate([
    customElement('pdf-viewer')
], PdfViewer);
export { PdfViewer };
//# sourceMappingURL=pdf-viewer.js.map