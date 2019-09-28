const pdfApiUri = `lib/pdfjs-dist/build/pdf.min.js`;
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
    while (pdfApiLoading)
        await new Promise(requestAnimationFrame);
    if (pdfApiReady)
        return pdfApiReady;
    try {
        pdfApiLoading = true;
        console.log('📃 PDF API loading...');
        await loadScript(pdfApiUri);
        while (!window.pdfjsLib)
            await new Promise(requestAnimationFrame);
        pdfApiReady = window.pdfjsLib;
        pdfApiReady.GlobalWorkerOptions.workerSrc = 'lib/pdfjs-dist/build/pdf.worker.min.js';
        console.log('📃 PDF API loaded.');
    }
    finally {
        pdfApiLoading = false;
    }
    return pdfApiReady;
}
//# sourceMappingURL=pdf-utility.js.map