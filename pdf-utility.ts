import { PDFDocumentProxy, PDFRenderTask } from './pdf'; // Definitions only

/** URI of the PDF JS library */
const pdfApiUri = `lib/pdfjs-dist/build/pdf.min.js`;

/** URI of the PDF JS web worker */
const pdfWorkerUri = `lib/pdfjs-dist/build/pdf.worker.min.js`;

/** Flag indicating that PDF library is currently being loaded, wait for it to . */
let pdfApiLoading = false;

/** Flag indicating that PDF library has been downloaded. */
let pdfApiReady: any;

/** Add a legacy side-effect script to the <head> of the page.
 * This is needed for the PDF.js API as it adds a global variable to the window.
 * @param uri The URI of the script.
 * @returns A promise that resolves once the script has loaded and rejects on error. */
function loadScript(uri: string) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script') as HTMLScriptElement;
        script.type = 'text/javascript';
        script.onload = resolve;
        script.onerror = reject;
        document.getElementsByTagName('head')[0].appendChild(script);
        script.src = uri;
    });
}

/** Get the PDF.js API */
export async function pdfApi(): Promise<any> {
    if (pdfApiReady)
        return pdfApiReady;

    while (pdfApiLoading)
        await new Promise(requestAnimationFrame);

    if (pdfApiReady)
        return pdfApiReady;

    try {
        pdfApiLoading = true;
        console.log('📃 PDF API loading...');
        console.time('📃 PDF API loaded.');

        // Add a <script> tag pointing to the API
        await loadScript(pdfApiUri);

        // Wait for the script to populate the global variable
        while (!(window as any).pdfjsLib)
            await new Promise(requestAnimationFrame);

        pdfApiReady = (window as any).pdfjsLib;
        // The workerSrc property needs to be specified.
        pdfApiReady.GlobalWorkerOptions.workerSrc = pdfWorkerUri;

        console.timeEnd('📃 PDF API loaded.');
    }
    finally { pdfApiLoading = false; }

    return pdfApiReady;
}