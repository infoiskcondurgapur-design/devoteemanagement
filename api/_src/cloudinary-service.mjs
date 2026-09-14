import { v2 as cloudinary } from 'cloudinary';

// On Vercel, env vars are provided via the dashboard — no dotenv needed.
// On local dev, Vercel CLI / .env.local loads env before this module is reached.
if (!cloudinary.config().cloud_name) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

/**
 * Uploads a base64 encoded image to Cloudinary and returns the secure URL
 * @param {string} base64String
 * @returns {Promise<string>}
 */
export const uploadImageToCloudinary = async (base64String) => {
    try {
        const result = await cloudinary.uploader.upload(base64String, {
            folder: 'dms_devotees',
            width: 800,
            crop: 'limit'
        });
        return result.secure_url;
    } catch (error) {
        console.error('[Cloudinary] Upload failed:', error.message);
        throw new Error('Image upload failed');
    }
};
