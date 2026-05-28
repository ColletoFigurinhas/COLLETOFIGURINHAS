import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api";

let pdfjs: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
  if (!pdfjs) {
    pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  return pdfjs;
}

export async function loadPDF(url: string): Promise<PDFDocumentProxy> {
  const lib = await getPdfjs();
  return lib.getDocument(url).promise;
}

export async function renderPageToCanvas(
  page: PDFPageProxy,
  scale = 1.5
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d")!;
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas;
}

export async function renderPDFPageToDataURL(
  doc: PDFDocumentProxy,
  pageNumber: number,
  scale = 1.5
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const canvas = await renderPageToCanvas(page, scale);
  return canvas.toDataURL("image/jpeg", 0.92);
}
