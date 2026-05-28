"use client";

import { useCallback, useState } from "react";

interface PDFUploaderProps {
  onFile: (url: string) => void;
}

export function PDFUploader({ onFile }: PDFUploaderProps) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.includes("pdf")) return;
      const url = URL.createObjectURL(file);
      onFile(url);
    },
    [onFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      className={`
        border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-200
        ${dragging
          ? "border-amber-400 bg-amber-900/20 scale-105"
          : "border-white/20 hover:border-amber-400/60 hover:bg-white/5"
        }
      `}
    >
      <div className="text-6xl mb-4">📖</div>
      <p className="text-white text-xl font-semibold mb-2">
        Arraste seu PDF aqui
      </p>
      <p className="text-white/50 text-sm mb-6">ou clique para selecionar</p>

      <label className="cursor-pointer px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-full text-white font-semibold transition-all inline-block">
        Selecionar PDF
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>

      <div className="mt-6 text-white/30 text-xs">
        Suporte: PDF · JPG · PNG
      </div>
    </div>
  );
}
