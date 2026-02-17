/* eslint-disable @next/next/no-img-element */
"use client"
import { useState } from "react";
import { FaXmark, FaChevronLeft, FaChevronRight } from "react-icons/fa6";

interface ImageGalleryProps {
  images: string[];
}

export const ImageGallery = ({ images }: ImageGalleryProps) => {
  const displayImages = (images || []).slice(0, 6);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  if (displayImages.length === 0) return null;

  return (
    <>
      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-[8px] sm:gap-[16px] mb-[20px]">
        {displayImages.map((image: string, index: number) => (
          <img
            key={index}
            src={image}
            alt=""
            className="w-full aspect-[232/145] object-contain rounded-[4px] border border-[#ddd] p-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openLightbox(index)}
          />
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center cursor-pointer"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button 
            className="absolute top-[20px] right-[20px] text-white text-[24px] hover:text-gray-300 cursor-pointer"
            onClick={closeLightbox}
          >
            <FaXmark />
          </button>

          {/* Navigation - Previous */}
          {displayImages.length > 1 && (
            <button 
              className="absolute left-[20px] top-1/2 -translate-y-1/2 text-white text-[32px] hover:text-gray-300 cursor-pointer p-[10px]"
              onClick={goToPrev}
            >
              <FaChevronLeft />
            </button>
          )}

          {/* Image */}
          <img
            src={displayImages[currentIndex]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-[8px]"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation - Next */}
          {displayImages.length > 1 && (
            <button 
              className="absolute right-[20px] top-1/2 -translate-y-1/2 text-white text-[32px] hover:text-gray-300 cursor-pointer p-[10px]"
              onClick={goToNext}
            >
              <FaChevronRight />
            </button>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 text-white text-[14px]">
            {currentIndex + 1} / {displayImages.length}
          </div>
        </div>
      )}
    </>
  );
};
