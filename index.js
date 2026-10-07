const bedrock = require('bedrock-protocol');
const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 10000;

// --- 1. بيانات بوت تيليجرام والـ API ---
const TELEGRAM_TOKEN = '8820559215:AAE8h59RJbtI66Q9p4LCH5V4NP2s4_-4XJI';
// ضع مفتاح الـ API الجديد الخاص بـ FalixNodes هنا:
const FALIX_API_KEY = 'حط_مفتاح_الـ_API_الجديد_هنا';
const PANEL_URL = 'https://client.falixnodes.net';

// تشغيل بوت تيليجرام
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// --- 2. وظيفة تشغيل سيرفر ماينكرافت عبر FalixNodes ---
async function startFalixServer() {
    try {
        const response = await axios.get(`${PANEL_URL}/api/client`, {
            headers: {
                'Authorization': `Bearer ${FALIX_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const servers = response.data.data;
        if (!servers || servers.length === 0) {
            return '❌ لم يتم العثور على أي سيرفرات في حسابك.';
        }

        let success = false;
        for (const server of servers) {
            const serverId = server.attributes.identifier;
            const startUrl = `${PANEL_URL}/api/client/servers/${serverId}/power`;
            
            const res = await axios.post(startUrl, { signal: 'start' }, {
                headers: {
                    'Authorization': `Bearer ${FALIX_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (res.status === 204 || res.status === 200) {
                success = True;
            }
        }

        return success ? '✅ تم إرسال أمر التشغيل للسيرفر بنجاح!' : '❌ حدث خطأ أثناء تشغيل السيرفر.';
    } catch (error) {
        return '❌ حدث خطأ في الاتصال باللوحة، تأكد من مفتاح الـ API.';
    }
}

// الاستجابة لأوامر تيليجرام
bot.onText(/\/(start|بدأ|بدء)/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '⏳ جاري الاتصال باللوحة وتشغيل السيرفر...');
    const resultMessage = await startFalixServer();
    bot.sendMessage(chatId, resultMessage);
});

// --- 3. خادم الويب (Keep-Alive) ---
app.get('/', (req, res) => {
    res.send('Bedrock Bot & Telegram Controller are running!');
});

app.listen(PORT, () => {
    console.log(`Web server is running on port ${PORT}`);
});

// --- 4. بوت البدروك (AFK Bot) ---
function createBedrockBot() {
    const client = bedrock.createClient({
        host: 'Pixelrealm0.progamer.me',
        port: 30027,
        username: 'VoltCraftBot',
        offline: true,
        version: '1.20.51'
    });

    client.on('spawn', () => {
        console.log('Bot connected to Bedrock server successfully!');
    });

    client.on('text', (packet) => {
        console.log(`[Chat] ${packet.sourceName}: ${packet.message}`);
    });

    client.on('disconnect', (packet) => {
        console.log('Bot disconnected:', packet);
        setTimeout(() => {
            createBedrockBot();
        }, 5000);
    });

    client.on('error', (err) => {
        console.log('Bot encountered an error:', err);
    });
}

createBedrockBot();
