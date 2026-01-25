'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

/**
 * Image component with loading state and blur placeholder
 * Features:
 * - Shows skeleton loader while image loads
 * - Smooth fade-in animation
 * - Automatic lazy loading
 * - Error handling with fallback
 */
interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete' | 'onError'> {
  fallbackSrc?: string;
  showLoader?: boolean;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  fallbackSrc = '/assets/images/placeholder.png',
  showLoader = true,
  className = '',
  ...props 
}: OptimizedImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  return (
    <div className="relative overflow-hidden" style={{ position: 'relative' }}>
      {/* Skeleton loader */}
      {loading && showLoader && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse" 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1
          }}
        />
      )}
      
      {/* Actual image */}
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        {...props}
      />
    </div>
  );
};
