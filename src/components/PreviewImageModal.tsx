"use client";
import React from "react";
import Image from "next/image";

interface ImagePreviewModalProps {
  src: string | null;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
  width?: number; // optional, mặc định 400
  height?: number; // optional, mặc định 400
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  src,
  isOpen,
  onClose,
  alt = "Preview",
  width = 400,
  height = 400,
}) => {
  if (!isOpen || !src) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="object-contain rounded"
        />
        <button
          className="absolute top-2 right-2 text-white bg-black/50 rounded px-2 py-1"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
