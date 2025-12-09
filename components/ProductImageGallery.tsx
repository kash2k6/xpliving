'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProductImageLightbox from './ProductImageLightbox';

interface ProductImageGalleryProps {
  productId: 'youth' | 'roman';
  className?: string;
  fallbackGradient?: string;
  clickable?: boolean;
}

// Common image extensions to try
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export default function ProductImageGallery({
  productId,
  className = '',
  fallbackGradient,
  clickable = true,
}: ProductImageGalleryProps) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    // Load images from API route
    const loadImages = async () => {
      try {
        const response = await fetch(`/api/products/images?productId=${productId}`);
        if (response.ok) {
          const data = await response.json();
          setImages(data.images || []);
        } else {
          setImages([]);
        }
      } catch (error) {
        console.error('Error loading images:', error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [productId]);

  // If no images found, show fallback gradient
  if (!loading && images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          background: fallbackGradient || 
            (productId === 'youth' 
              ? 'linear-gradient(to bottom, #0D6B4D, #093F2E)' 
              : 'linear-gradient(to bottom, #8B4513, #5D2F0A)'),
        }}
      >
        <div className="text-white text-[10px] font-semibold opacity-50">
          {productId === 'youth' ? 'Liquid' : 'Roman'}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          background: fallbackGradient || 
            (productId === 'youth' 
              ? 'linear-gradient(to bottom, #0D6B4D, #093F2E)' 
              : 'linear-gradient(to bottom, #8B4513, #5D2F0A)'),
        }}
      >
        <div className="text-white text-[10px] font-semibold opacity-50">
          {productId === 'youth' ? 'Liquid' : 'Roman'}
        </div>
      </div>
    );
  }

  const handleImageError = (imagePath: string) => {
    setImageErrors((prev) => new Set(prev).add(imagePath));
    setImages((prev) => prev.filter((img) => img !== imagePath));
  };

  // Single image - no scrolling needed
  if (images.length === 1) {
    return (
      <>
        <div
          className={`relative overflow-hidden ${className} ${clickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onClick={clickable ? () => setLightboxOpen(true) : undefined}
        >
          <Image
            src={images[0]}
            alt={`${productId} product image`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => handleImageError(images[0])}
          />
        </div>
        {clickable && (
          <ProductImageLightbox
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            productId={productId}
            images={images}
            initialIndex={0}
          />
        )}
      </>
    );
  }

  // Multiple images - scrollable gallery
  return (
    <>
      <div className={`relative ${className}`}>
        <div
          className={`relative w-full h-full overflow-hidden rounded-xl ${clickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onClick={clickable ? () => setLightboxOpen(true) : undefined}
        >
          <div
            className="flex transition-transform duration-300 ease-in-out h-full"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {images.map((image, index) => (
              <div key={index} className="min-w-full h-full relative">
                <Image
                  src={image}
                  alt={`${productId} product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => handleImageError(image)}
                />
              </div>
            ))}
          </div>
        </div>
      
      {/* Navigation dots */}
      {images.length > 1 && (
        <div
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white opacity-100'
                  : 'bg-white opacity-40 hover:opacity-70'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            }}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors z-10"
            aria-label="Previous image"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors z-10"
            aria-label="Next image"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      </div>
      {clickable && (
        <ProductImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          productId={productId}
          images={images}
          initialIndex={currentIndex}
        />
      )}
    </>
  );
}

