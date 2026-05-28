"use client";

import { useState, useEffect, useCallback } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { loadPDF, renderPDFPageToDataURL } from "@/utils/pdfLoader";

interface UsePDFResult {
  totalPages: number;
  loading: boolean;
  error: string | null;
  getPageDataURL: (pageNumber: number) => Promise<string>;
}

const cache = new Map<string, string>();

export function usePDF(url: string | null): UsePDFResult {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);

    loadPDF(url)
      .then((d) => {
        setDoc(d);
        setTotalPages(d.numPages);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url]);

  const getPageDataURL = useCallback(
    async (pageNumber: number): Promise<string> => {
      const key = `${url}:${pageNumber}`;
      if (cache.has(key)) return cache.get(key)!;
      if (!doc) return "";
      const dataURL = await renderPDFPageToDataURL(doc, pageNumber);
      cache.set(key, dataURL);
      return dataURL;
    },
    [doc, url]
  );

  return { totalPages, loading, error, getPageDataURL };
}
