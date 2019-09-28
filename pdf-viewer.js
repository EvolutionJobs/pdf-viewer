var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, property, customElement, query } from '../../lib/lit-element/lit-element.js';
import './pdf-viewer-document.js';
const styles = css `
:host {
    display: block;
}`;
let PdfViewer = class PdfViewer extends LitElement {
    static get styles() { return [styles]; }
    render() {
        return html `
<div>
    <button @tap=${e => this.pdfDocument.zoomin()}>+</button>
    <button @tap=${e => this.pdfDocument.zoomout()}>-</button>
    <button @tap=${this.expandFull}>Expand</button>
</div>
<pdf-viewer-document src="https://www.w3.org/TR/1998/REC-html40-19980424/html40.pdf" .highlight=${[/html/gi, 'w3c']}></pdf-viewer-document>`;
    }
    expandFull() {
        const target = `${this.src}#toolbar=1`;
        window.open(target, '_blank');
    }
};
__decorate([
    property()
], PdfViewer.prototype, "src", void 0);
__decorate([
    property()
], PdfViewer.prototype, "highlight", void 0);
__decorate([
    query('pdf-viewer-document')
], PdfViewer.prototype, "pdfDocument", void 0);
PdfViewer = __decorate([
    customElement('pdf-viewer')
], PdfViewer);
export { PdfViewer };
//# sourceMappingURL=pdf-viewer.js.map