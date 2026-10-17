/**
 * Client-Side Image Compression Utility
 * Resizes high-resolution smartphone camera photos to compact web-ready JPEGs.
 * Typical reduction: 15MB+ camera photo -> ~35KB (99.8% reduction)
 */
export const compressImage = (fileOrBase64, maxDim = 500, quality = 0.75) => {
    return new Promise((resolve, reject) => {
        if (!fileOrBase64) return resolve('');

        const processDataUrl = (dataUrl) => {
            // Keep Cloudinary or external HTTP URLs as-is
            if (typeof dataUrl === 'string' && dataUrl.startsWith('http')) {
                return resolve(dataUrl);
            }

            // If already very small (< 15KB) base64, keep it
            if (typeof dataUrl === 'string' && dataUrl.startsWith('data:') && dataUrl.length < 15000) {
                return resolve(dataUrl);
            }

            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            };
            img.onerror = (err) => {
                console.warn('[ImageCompress] Fallback to original:', err);
                resolve(dataUrl);
            };
            img.src = dataUrl;
        };

        if (typeof fileOrBase64 === 'string') {
            processDataUrl(fileOrBase64);
        } else if (fileOrBase64 instanceof Blob || fileOrBase64 instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => processDataUrl(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(fileOrBase64);
        } else {
            resolve('');
        }
    });
};
