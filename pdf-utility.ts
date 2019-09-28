import { PDFDocumentProxy, PDFRenderTask } from './pdf'; // Definitions only

/** URI of the PDF JS library */
const pdfApiUri = `lib/pdfjs-dist/build/pdf.min.js`;

/** Flag indicating that PDF library is currently being loaded, wait for it to . */
let pdfApiLoading = false;

/** Flag indicating that PDF library has been downloaded. */
let pdfApiReady: any;

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

        // Add a <script> tag pointing to the API
        await loadScript(pdfApiUri);
        //await loadScript(pdfTextlayerUri);

        // Wait for the script to fire the callback method
        while (!(window as any).pdfjsLib)
            await new Promise(requestAnimationFrame);

        pdfApiReady = (window as any).pdfjsLib;
        // The workerSrc property needs to be specified.
        pdfApiReady.GlobalWorkerOptions.workerSrc = 'lib/pdfjs-dist/build/pdf.worker.min.js';

        console.log('📃 PDF API loaded.');
    }
    finally { pdfApiLoading = false; }

    return pdfApiReady;
}