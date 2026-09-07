import whatsappService from '../services/whatsappService.mjs';
import qrcode from 'qrcode';

export const getStatus = (req, res) => {
    res.json({ success: true, status: whatsappService.status });
};

export const getMessages = (req, res) => {
    res.json({ success: true, messages: whatsappService.recentMessages });
};

export const getQR = async (req, res) => {
    if (whatsappService.lastQr) {
        try {
            const qrDataUrl = await qrcode.toDataURL(whatsappService.lastQr);
            res.json({ success: true, qr: qrDataUrl });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Failed to generate QR image' });
        }
    } else {
        res.json({ 
            success: true, 
            qr: null, 
            message: whatsappService.status === 'READY' ? 'Already connected' : 'QR not ready' 
        });
    }
};

export const sendMessage = async (req, res) => {
    const { number, message, media } = req.body;

    if (whatsappService.status !== 'READY') {
        return res.status(400).json({ success: false, error: 'WhatsApp bot is not connected' });
    }

    if (!number || !message) {
        return res.status(400).json({ success: false, error: 'Number and message are required' });
    }

    try {
        await whatsappService.sendMessage(number, message, media);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('[WhatsApp] Send error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const broadcast = async (req, res) => {
    const { numbers, message } = req.body;
    if (!numbers || !Array.isArray(numbers) || !message) {
        return res.status(400).json({ success: false, error: 'Numbers (array) and message are required' });
    }

    if (whatsappService.status !== 'READY') {
        return res.status(400).json({ success: false, error: 'WhatsApp bot is not connected' });
    }

    res.json({ success: true, message: 'Broadcast started' });

    // Process broadcast in background with delay
    (async () => {
        let sent = 0;
        let failed = 0;
        for (const number of numbers) {
            try {
                await whatsappService.sendMessage(number, message);
                sent++;
                await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
            } catch (err) {
                console.error(`[WhatsApp] Broadcast failed for ${number}:`, err.message);
                failed++;
            }
        }
        console.log(`[WhatsApp] Broadcast complete. Sent: ${sent}, Failed: ${failed}`);
    })();
};

export const logout = async (req, res) => {
    try {
        await whatsappService.logout();
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const restart = async (req, res) => {
    try {
        await whatsappService.restart();
        res.json({ success: true, message: 'Restarting...' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// SSE Endpoint
export const streamUpdates = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    whatsappService.addSSEClient(res);
    
    // Initial status
    res.write(`data: ${JSON.stringify({ type: 'status', status: whatsappService.status })}\n\n`);
};
