import { randomUUID } from 'crypto';
import { addDevotee } from '../database.mjs';
import { uploadImageToCloudinary } from '../cloudinary-service.mjs';

// Enum values mirrored from src/pages/devotees/devoteeSchema.js so the public
// endpoint enforces the same contract the admin form does.
const GENDERS = ['Male', 'Female', 'Other'];
const RELATION_TYPES = ['Father', 'Husband', 'Wife'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];
const SPIRITUAL_STATUSES = ['Aspiring', 'Sheltered', 'Initiated'];

// base64 of a ~10MB image is ~13.7M chars; the JSON body limit is 15mb.
const MAX_PHOTO_BASE64_CHARS = 14000000;
const PHOTO_DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

const badRequest = (res, error) => res.status(400).json({ success: false, error });

const validate = (body) => {
    if (!body || typeof body !== 'object') return 'Invalid request body';

    const name = (body.name || '').toString().trim();
    if (!name) return 'Name is required';
    if (name.length > 120) return 'Name is too long';

    if (!GENDERS.includes(body.gender)) return 'Please select a valid gender';
    if (!RELATION_TYPES.includes(body.relationType)) return 'Please select a valid relation type';
    if (!MARITAL_STATUSES.includes(body.maritalStatus)) return 'Please select a valid marital status';
    if (!SPIRITUAL_STATUSES.includes(body.spiritualStatus)) return 'Please select a valid spiritual status';

    const contact = (body.contact || '').toString().trim();
    if (!/^[6-9]\d{9}$/.test(contact)) return 'Enter a valid 10-digit mobile number';

    if (body.email && body.email.toString().trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.toString().trim())) {
        return 'Enter a valid email address';
    }

    if (body.photo !== undefined && body.photo !== null && body.photo !== '') {
        const photo = body.photo.toString();
        if (!PHOTO_DATA_URL_RE.test(photo)) return 'Photo must be an image file';
        if (photo.length > MAX_PHOTO_BASE64_CHARS) return 'Photo is too large (max 10 MB)';
    }

    return null;
};

/**
 * POST /api/public/register
 * Unauthenticated self-registration used by the shareable #/register form.
 * The server owns id/status/source/createdAt — clients cannot set them.
 */
export const register = async (req, res) => {
    try {
        const body = req.body || {};

        // Honeypot: bots fill hidden fields. Pretend success, store nothing.
        if (body.website && body.website.toString().trim() !== '') {
            return res.json({ success: true, id: randomUUID(), status: 'Pending' });
        }

        const validationError = validate(body);
        if (validationError) return badRequest(res, validationError);

        const payload = { ...body };
        // Never trust the client for server-owned fields.
        delete payload.id;
        delete payload.status;
        delete payload.source;
        delete payload.createdAt;
        delete payload.website;

        if (payload.photo && PHOTO_DATA_URL_RE.test(payload.photo.toString())) {
            payload.photo = await uploadImageToCloudinary(payload.photo);
        }

        payload.id = randomUUID();
        payload.status = 'Pending';
        payload.source = 'Public Form';
        payload.createdAt = new Date().toISOString();

        const result = await addDevotee(payload);

        res.json({
            success: true,
            id: result.id || payload.id,
            status: 'Pending',
            message: 'Registration submitted successfully. It will be reviewed by an administrator.'
        });
    } catch (error) {
        // Duplicate guard from addDevotee — respond generically so a stranger
        // can never learn which devotee already has this contact number.
        if (error && /already exists/i.test(error.message || '')) {
            return res.status(409).json({
                success: false,
                error: 'A registration with this name and mobile number already exists.'
            });
        }
        console.error('[Public] Registration error:', error);
        res.status(500).json({ success: false, error: 'Registration failed. Please try again later.' });
    }
};
