const pdfApiUri = `lib/pdfjs-dist/build/pdf.min.js`;
const pdfWorkerUri = `lib/pdfjs-dist/build/pdf.worker.min.js`;
let pdfApiLoading = false;
let pdfApiReady;
function loadScript(uri) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.onload = resolve;
        script.onerror = reject;
        document.getElementsByTagName('head')[0].appendChild(script);
        script.src = uri;
    });
}
export async function pdfApi() {
    if (pdfApiReady)
        return pdfApiReady;
    if (window.pdfjsLib)
        return pdfApiReady = window.pdfjsLib;
    while (pdfApiLoading)
        await new Promise(requestAnimationFrame);
    if (pdfApiReady)
        return pdfApiReady;
    try {
        pdfApiLoading = true;
        console.log('📃 PDF API loading...');
        console.time('📃 PDF API loaded.');
        await loadScript(pdfApiUri);
        while (!window.pdfjsLib)
            await new Promise(requestAnimationFrame);
        pdfApiReady = window.pdfjsLib;
        pdfApiReady.GlobalWorkerOptions.workerSrc = pdfWorkerUri;
        console.timeEnd('📃 PDF API loaded.');
    }
    finally {
        pdfApiLoading = false;
    }
    return pdfApiReady;
}
export async function firstPageSize(pdf, zoom) {
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: zoom });
    return {
        width: viewport.width,
        height: viewport.height
    };
}
//# sourceMappingURL=pdf-utility.js.map