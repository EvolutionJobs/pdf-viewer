var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, property, customElement, query, eventOptions } from '../../lib/lit-element/lit-element.js';
import './pdf-viewer-document.js';
import './plain-text.js';
import '../../lib/@polymer/paper-icon-button/paper-icon-button.js';
import '../../lib/@polymer/iron-icons/iron-icons.js';
import '../../lib/@polymer/paper-tooltip/paper-tooltip.js';
import '../../lib/@polymer/paper-spinner/paper-spinner.js';
const styles = css `
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
let PdfViewer = class PdfViewer extends LitElement {
    static get styles() { return [styles]; }
    renderActions(fitMode) {
        const fitIcon = fitMode === 'width' ? 'fullscreen-exit' : 'fullscreen';
        return html `
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
</slot>`;
    }
    renderError(error) {
        if (this.fallback)
            return html `
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
        return html `
<div class="center-overlay">
    <slot name="error">
        <div>
            <h2>${this.loadError.name || 'Exception'}</h2>
            ${this.loadError.message}
        </div>
    </slot>
</div>`;
    }
    renderSpinner() {
        return html `
<div class="center-overlay">
    <slot name="loader">
        <paper-spinner active></paper-spinner>
    </slot>
</div>`;
    }
    render() {
        return html `
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
    pdfLoading(e) {
        this.loadError = undefined;
        this.loaded = false;
    }
    pdfLoaded(e) {
        this.loaded = true;
    }
    pdfLoadError(e) {
        this.loadError = e.detail;
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
], PdfViewer.prototype, "fallback", void 0);
__decorate([
    property()
], PdfViewer.prototype, "fitMode", void 0);
__decorate([
    property()
], PdfViewer.prototype, "loaded", void 0);
__decorate([
    property()
], PdfViewer.prototype, "loadError", void 0);
__decorate([
    query('pdf-viewer-document')
], PdfViewer.prototype, "pdfDocument", void 0);
__decorate([
    eventOptions({ capture: false, passive: true })
], PdfViewer.prototype, "expandFull", null);
__decorate([
    eventOptions({ capture: false, passive: true })
], PdfViewer.prototype, "toggleFit", null);
__decorate([
    eventOptions({ capture: false, passive: true })
], PdfViewer.prototype, "zoomin", null);
__decorate([
    eventOptions({ capture: false, passive: true })
], PdfViewer.prototype, "zoomout", null);
__decorate([
    eventOptions({ capture: false, passive: true })
], PdfViewer.prototype, "pdfLoading", null);
__decorate([
    eventOptions({ capture: false, passive: true })
], PdfViewer.prototype, "pdfLoaded", null);
__decorate([
    eventOptions({ capture: false, passive: true })
], PdfViewer.prototype, "pdfLoadError", null);
PdfViewer = __decorate([
    customElement('pdf-viewer')
], PdfViewer);
export { PdfViewer };
//# sourceMappingURL=pdf-viewer.js.map