import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WhatsAppService {
    constructor() {
        this.client = null;
        this.status = 'INITIALIZING';
        this.lastQr = null;
        this.recentMessages = [];
        this.clients = []; // SSE clients
        this.sessionsPath = path.join(__dirname, '..', 'sessions');
    }

    async initialize() {
        if (!fs.existsSync(this.sessionsPath)) {
            fs.mkdirSync(this.sessionsPath, { recursive: true });
        }

        const chromePath = this.getChromePath();

        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: this.sessionsPath
            }),
            puppeteer: {
                headless: true,
                executablePath: chromePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-infobars',
                    '--disable-extensions',
                    '--disable-background-networking',
                    '--window-position=0,0',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                ],
                timeout: 60000,
            }
        });

        this.attachEvents();

        console.log('[WhatsApp] Initializing client...');
        try {
            await this.client.initialize();
            console.log('[WhatsApp] client.initialize() successful');
        } catch (err) {
            console.error('[WhatsApp] Initialization error:', err);
            this.updateStatus('ERROR');
        }
    }

    getChromePath() {
        // Explicit override (most reliable on servers/containers).
        if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
        const paths = [
            // Linux (servers / containers)
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/brave-browser',
            // Windows (desktop app)
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        return undefined;
    }

    attachEvents() {
        this.client.on('qr', (qr) => {
            this.lastQr = qr;
            this.updateStatus('QR_RECEIVED');
            console.log('[WhatsApp] QR Code received');
            qrcodeTerminal.generate(qr, { small: true });
            this.broadcastToSSEClients({ type: 'qr', qr });
        });

        this.client.on('ready', () => {
            this.lastQr = null;
            this.updateStatus('READY');
            console.log('[WhatsApp] Client is ready');
            this.broadcastToSSEClients({ type: 'status', status: 'READY' });
        });

        this.client.on('authenticated', () => {
            this.lastQr = null;
            this.updateStatus('INITIALIZING');
            console.log('[WhatsApp] Authenticated');
        });

        this.client.on('auth_failure', (msg) => {
            this.updateStatus('AUTHENTICATION_FAILURE');
            console.error('[WhatsApp] Auth failure:', msg);
        });

        this.client.on('disconnected', (reason) => {
            this.lastQr = null;
            this.updateStatus('DISCONNECTED');
            console.log('[WhatsApp] Client disconnected:', reason);
            this.broadcastToSSEClients({ type: 'status', status: 'DISCONNECTED' });
        });

        this.client.on('message', async (msg) => {
            try {
                const contact = await msg.getContact();
                const messageData = {
                    id: msg.id.id,
                    from: msg.from,
                    sender: contact.pushname || contact.name || msg.from.split('@')[0],
                    body: msg.body,
                    timestamp: new Date().toISOString(),
                    isGroup: msg.isGroupMsg,
                    isMine: false
                };
                this.addRecentMessage(messageData);
                this.broadcastToSSEClients({ type: 'message', message: messageData });
            } catch (err) {
                console.error('[WhatsApp] Error processing message:', err.message);
            }
        });

        this.client.on('message_create', async (msg) => {
            if (msg.fromMe) {
                try {
                    const messageData = {
                        id: msg.id.id,
                        from: msg.from,
                        sender: 'You',
                        body: msg.body,
                        timestamp: new Date().toISOString(),
                        isGroup: msg.isGroupMsg,
                        isMine: true
                    };
                    this.addRecentMessage(messageData);
                    this.broadcastToSSEClients({ type: 'message', message: messageData });
                } catch (err) {
                    console.error('[WhatsApp] Error processing outgoing message:', err.message);
                }
            }
        });
    }

    updateStatus(status) {
        this.status = status;
    }

    addRecentMessage(message) {
        this.recentMessages.push(message);
        if (this.recentMessages.length > 100) {
            this.recentMessages.shift();
        }
    }

    // SSE Management
    addSSEClient(res) {
        this.clients.push(res);
        res.on('close', () => {
            this.clients = this.clients.filter(c => c !== res);
        });
    }

    broadcastToSSEClients(data) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        this.clients.forEach(client => client.write(payload));
    }

    async sendMessage(number, message, media = null) {
        if (this.status !== 'READY') {
            throw new Error('WhatsApp bot is not connected');
        }
        const sanitizedNumber = number.includes('@c.us') ? number : `${number}@c.us`;

        if (media) {
            // Expected media format: { data: 'base64str', mimetype: 'image/png', filename: 'receipt.png' }
            const messageMedia = new MessageMedia(media.mimetype, media.data, media.filename);
            return this.client.sendMessage(sanitizedNumber, messageMedia, { caption: message });
        }

        return this.client.sendMessage(sanitizedNumber, message);
    }

    async logout() {
        if (this.client) {
            await this.client.logout();
            this.updateStatus('DISCONNECTED');
        }
    }

    async restart() {
        if (this.client) {
            try { await this.client.destroy(); } catch (e) { }
        }
        this.lastQr = null;
        this.updateStatus('INITIALIZING');
        await this.initialize();
    }
}

export default new WhatsAppService();
