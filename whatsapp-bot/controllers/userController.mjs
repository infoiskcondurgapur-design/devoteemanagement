import crypto from 'crypto';
import { getUsers, createUser as dbCreateUser, getUserByIdentity, updateUserRole as dbUpdateUserRole, deleteUser as dbDeleteUser } from '../database.mjs';

const hashPassword = (password) => {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `${salt}:${hash}`;
};

export const listUsers = async (req, res) => {
    try {
        const users = await getUsers();
        res.json({ success: true, data: users || [] });
    } catch (err) {
        console.error('[User] listUsers error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};

export const createUser = async (req, res) => {
    try {
        const { username, email, password, role = 'viewer', fullName = null } = req.body;
        if (!username || !username.trim()) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }
        const validRoles = ['admin', 'counselor', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }

        const existing = await getUserByIdentity(username.trim());
        if (existing) {
            return res.status(409).json({ success: false, error: 'User with this username already exists' });
        }
        if (email && email.trim()) {
            const existingEmail = await getUserByIdentity(email.trim());
            if (existingEmail) {
                return res.status(409).json({ success: false, error: 'User with this email already exists' });
            }
        }

        const passwordHash = hashPassword(password);
        const result = await dbCreateUser({
            username: username.trim(),
            email: email ? email.trim() : null,
            passwordHash,
            role,
            fullName: fullName ? fullName.trim() : null
        });

        res.json({
            success: true,
            user: {
                id: result.id,
                username: username.trim(),
                email: email ? email.trim() : null,
                role,
                fullName: fullName ? fullName.trim() : null
            }
        });
    } catch (err) {
        console.error('[User] createUser error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to create user' });
    }
};

export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const validRoles = ['admin', 'counselor', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }
        await dbUpdateUserRole(id, role);
        res.json({ success: true, message: 'Role updated successfully' });
    } catch (err) {
        console.error('[User] updateRole error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to update user role' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (String(id) === String(req.user?.id)) {
            return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
        }
        await dbDeleteUser(id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('[User] deleteUser error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
};
