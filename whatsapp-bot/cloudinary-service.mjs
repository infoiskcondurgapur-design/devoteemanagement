import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables before configuring Cloudinary
dotenv.config({ path: path.join(__dirname, '.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a base64 encoded image to Cloudinary and returns the secure URL
 * @param {string} base64String 
 * @returns {Promise<string>}
 */
export const uploadImageToCloudinary = async (base64String) => {
    try {
        const result = await cloudinary.uploader.upload(base64String, {
            folder: 'dms_devotees',
            // Resize if it's too large, save some bandwidth
            width: 800,
            crop: 'limit'
        });
        return result.secure_url;
    } catch (error) {
        console.error('[Cloudinary] Upload failed:', error);
        try {
            const logPath = path.join(__dirname, 'cloudinary_error.log');
            const errorDetails = `[${new Date().toISOString()}] Upload failed.\nError Message: ${error.message}\nError Details: ${JSON.stringify(error, null, 2)}\nStack: ${error.stack}\n\n`;
            fs.appendFileSync(logPath, errorDetails);
        } catch (logErr) {
            console.error('Failed to write to cloudinary_error.log:', logErr);
        }
        throw new Error('Image upload failed');
    }
};
