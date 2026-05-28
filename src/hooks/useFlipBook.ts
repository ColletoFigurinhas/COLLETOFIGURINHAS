"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface FlipBookState {
  currentPage: number;
  totalPages: number;
  isFlipping: boolean;
  direction: "next" | "prev" | null;
}

export function useFlipBook(totalPages: number) {
  const [state, setState] = useState<FlipBookState>({
    currentPage: 0,
    totalPages,
    isFlipping: false,
    direction: null,
  });

  // Keep totalPages in sync when it changes (e.g. async page generation)
  useEffect(() => {
    if (totalPages !== state.totalPages) {
      setState((s) => ({ ...s, totalPages, currentPage: 0 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlippingRef = useRef(false);

  const flipTo = useCallback(
    (targetPage: number, dir: "next" | "prev", total: number) => {
      if (isFlippingRef.current) return;
      if (targetPage < 0 || targetPage >= total) return;

      isFlippingRef.current = true;
      setState((s) => ({ ...s, isFlipping: true, direction: dir }));

      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = setTimeout(() => {
        isFlippingRef.current = false;
        setState((s) => ({
          ...s,
          currentPage: targetPage,
          isFlipping: false,
          direction: null,
        }));
      }, 800);
    },
    []
  );

  const nextPage = useCallback(() => {
    setState((s) => {
      flipTo(s.currentPage + 2, "next", s.totalPages);
      return s;
    });
  }, [flipTo]);

  const prevPage = useCallback(() => {
    setState((s) => {
      flipTo(s.currentPage - 2, "prev", s.totalPages);
      return s;
    });
  }, [flipTo]);

  const goToPage = useCallback(
    (page: number) => {
      setState((s) => {
        const dir = page > s.currentPage ? "next" : "prev";
        flipTo(page, dir, s.totalPages);
        return s;
      });
    },
    [flipTo]
  );

  return { state, nextPage, prevPage, goToPage };
}
