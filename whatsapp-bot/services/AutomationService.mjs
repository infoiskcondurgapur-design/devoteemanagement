import * as db from '../database.mjs';
import whatsappService from './whatsappService.mjs';
import cloudBackupService from './CloudBackupService.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(__dirname, '..', 'automation_state.json');

class AutomationService {
    constructor() {
        this.interval = null;
        this.lastRunDate = null;
        this.loadState();
    }

    loadState() {
        if (fs.existsSync(STATE_FILE)) {
            try {
                const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
                this.lastRunDate = data.lastRunDate;
            } catch (e) {
                this.lastRunDate = null;
            }
        }
    }

    saveState() {
        fs.writeFileSync(STATE_FILE, JSON.stringify({ lastRunDate: this.lastRunDate }), 'utf8');
    }

    async initialize() {
        console.log('[Automation] Initializing autonomous services...');
        // Check every minute
        this.interval = setInterval(() => this.checkAndRun(), 60000);
        this.checkAndRun(); // Initial check
    }

    async checkAndRun() {
        try {
            const settings = await db.getSettings();
            if (settings.automation_enabled !== 'true') return;

            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            
            const [targetHour, targetMinute] = (settings.automation_time || '07:00').split(':').map(Number);

            if (now.getHours() === targetHour && now.getMinutes() >= targetMinute && this.lastRunDate !== todayStr) {
                console.log(`[Automation] It's ${settings.automation_time}. Starting daily automated tasks...`);
                await this.runDailyTasks(settings);
                this.lastRunDate = todayStr;
                this.saveState();
            }
        } catch (err) {
            console.error('[Automation] Check failed:', err);
        }
    }

    async runDailyTasks(settings) {
        try {
            await this.sendBirthdayWishes(settings);
            await this.sendAnniversaryWishes(settings);
            
            console.log('[Automation] Executing automated cloud backups...');
            await cloudBackupService.syncAllClouds(false);
            
            console.log('[Automation] Daily automated tasks completed successfully.');
        } catch (error) {
            console.error('[Automation] Error during daily tasks:', error);
        }
    }

    async sendBirthdayWishes(settings) {
        if (whatsappService.status !== 'READY') {
            console.log('[Automation] WhatsApp not ready, skipping wishes.');
            return;
        }

        console.log('[Automation] Checking for birthdays today...');
        const stats = await db.getDevoteeStats();
        const list = stats.birthdaysTodayList || [];

        for (const devotee of list) {
            const contact = devotee.contact || devotee.whatsapp;
            if (!contact) continue;
            
            const name = devotee.initiatedName || devotee.name;
            const title = devotee.gender === 'Female' ? 'Mataji' : 'Prabhu';
            
            const template = settings.birthday_message || "Happy Birthday {name}!";
            const message = template.replace(/{name}/gi, name).replace(/{title}/gi, title);
            
            try {
                await whatsappService.sendMessage(contact, message);
                console.log(`[Automation] Sent birthday wish to ${name}`);
                await new Promise(r => setTimeout(r, 3000)); // Delay to be safe
            } catch (err) {
                console.error(`[Automation] Failed to send wish to ${name}:`, err.message);
            }
        }
    }

    async sendAnniversaryWishes(settings) {
        if (whatsappService.status !== 'READY') return;

        console.log('[Automation] Checking for anniversaries today...');
        const stats = await db.getDevoteeStats();
        const list = stats.anniversariesTodayList || [];

        for (const devotee of list) {
            const contact = devotee.contact || devotee.whatsapp;
            if (!contact) continue;
            
            const name = devotee.initiatedName || devotee.name;
            const title = devotee.gender === 'Female' ? 'Mataji' : 'Prabhu';
            
            const template = settings.anniversary_message || "Happy Anniversary {name}!";
            const message = template.replace(/{name}/gi, name).replace(/{title}/gi, title);
            
            try {
                await whatsappService.sendMessage(contact, message);
                console.log(`[Automation] Sent anniversary wish to ${name}`);
                await new Promise(r => setTimeout(r, 3000));
            } catch (err) {
                console.error(`[Automation] Failed to send anniversary wish to ${name}:`, err.message);
            }
        }
    }
}

export default new AutomationService();
