import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Returns the highest resolution / original image URL if transformed (e.g. Unsplash or Cloudinary)
 */
export const getOriginalImageUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    
    // If it's an Unsplash cropped/resized URL, remove the constraints or request high quality
    if (url.includes('images.unsplash.com')) {
        try {
            const urlObj = new URL(url);
            urlObj.searchParams.delete('w');
            urlObj.searchParams.delete('h');
            urlObj.searchParams.delete('fit');
            urlObj.searchParams.delete('crop');
            urlObj.searchParams.set('auto', 'format');
            urlObj.searchParams.set('q', '95');
            return urlObj.toString();
        } catch {
            return url;
        }
    }

    // If Cloudinary URL with transformation parameters in the path
    // e.g. /image/upload/c_thumb,w_200,h_200/v1234/file.jpg -> /image/upload/v1234/file.jpg
    if (url.includes('res.cloudinary.com')) {
        return url.replace(/\/image\/upload\/(?:[a-zA-Z0-9_,]+)\/(v\d+)/, '/image/upload/$1');
    }

    return url;
};

const ImageModal = ({
    isOpen,
    onClose,
    imageUrl,
    altText = 'Original Profile Image',
    title = '',
    subtitle = ''
}) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Reset state whenever modal opens or image changes
    useEffect(() => {
        if (isOpen) {
            setIsZoomed(false);
            setIsLoading(true);
            setHasError(false);
            
            // Prevent background page scrolling
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = originalOverflow;
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, imageUrl, onClose]);

    if (!isOpen || !imageUrl) return null;

    const originalSrc = getOriginalImageUrl(imageUrl);

    const handleDownload = async () => {
        try {
            const response = await fetch(originalSrc, { mode: 'cors' });
            if (!response.ok) throw new Error('Fetch failed');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const ext = blob.type.split('/')[1] || 'jpg';
            link.download = `${(title || 'devotee_photo').toLowerCase().replace(/[^a-z0-9]/g, '_')}_original.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            // Fallback for CORS blocked or direct image downloads
            const link = document.createElement('a');
            link.href = originalSrc;
            link.target = '_blank';
            link.download = `${(title || 'devotee_photo').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            {/* Top Toolbar */}
            <div 
                className="absolute top-0 left-0 right-0 p-4 sm:px-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image info */}
                <div className="flex flex-col min-w-0 pr-4">
                    {title && (
                        <h3 className="text-white font-bold text-base sm:text-lg truncate drop-shadow-sm">
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="text-white/70 text-xs sm:text-sm font-medium truncate drop-shadow-sm">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsZoomed(!isZoomed)}
                        title={isZoomed ? "Fit to Screen" : "Actual Size"}
                        className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
                    >
                        {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                    </button>

                    <button
                        type="button"
                        onClick={handleDownload}
                        title="Download Original Image"
                        className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
                    >
                        <Download className="w-5 h-5" />
                    </button>

                    <a
                        href={originalSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Original in New Tab"
                        className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </a>

                    <button
                        type="button"
                        onClick={onClose}
                        title="Close (Esc)"
                        className="p-2 text-white hover:text-white bg-white/20 hover:bg-red-600 rounded-full backdrop-blur-sm transition-all ml-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Modal Body / Image Preview */}
            <div 
                className="relative flex items-center justify-center max-w-full max-h-full overflow-auto p-2"
                onClick={(e) => e.stopPropagation()}
            >
                {isLoading && !hasError && (
                    <div className="flex flex-col items-center justify-center text-white/70 gap-2 p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        <span className="text-xs font-medium">Loading original image...</span>
                    </div>
                )}

                {hasError ? (
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/20 text-center text-white max-w-sm">
                        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                        <p className="font-semibold text-sm">Unable to load original image</p>
                        <p className="text-xs text-white/70 mt-1 mb-4">The image source might be unavailable or invalid.</p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <img
                        src={originalSrc}
                        alt={altText}
                        onLoad={() => setIsLoading(false)}
                        onError={() => {
                            setIsLoading(false);
                            setHasError(true);
                        }}
                        onClick={() => setIsZoomed(!isZoomed)}
                        className={`transition-all duration-300 rounded-lg shadow-2xl cursor-pointer ${
                            isLoading ? 'hidden' : 'block'
                        } ${
                            isZoomed 
                                ? 'max-w-none max-h-none object-none cursor-zoom-out' 
                                : 'max-h-[85vh] max-w-[90vw] object-contain cursor-zoom-in'
                        }`}
                        title="Click to toggle zoom"
                    />
                )}
            </div>
        </div>
    );
};

export default ImageModal;
