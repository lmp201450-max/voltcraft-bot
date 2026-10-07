const bedrock = require('bedrock-protocol');
const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 10000;

// --- 1. البيانات ---
const TELEGRAM_TOKEN = '8820559215:AAE8h59RJbtI66Q9p4LCH5V4NP2s4_-4XJI';
const FALIX_API_KEY = 'flx_live_WQUUjturfcgSKqUQyAYB3x60eyceJ0wpkseTZODh'; 
const SERVER_ID = '3503676';

const PANEL_URL = 'https://client.falixnodes.net';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// --- 2. وظيفة تشغيل السيرفر ---
async function startFalixServer() {
    try {
        const startUrl = `${PANEL_URL}/api/client/servers/${SERVER_ID}/power`;
        
        const res = await axios.post(
            startUrl, 
            { signal: 'start' }, 
            {
                headers: {
                    'Authorization': `Bearer ${FALIX_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        if (res.status === 204 || res.status === 200) {
            return '✅ تم إرسال أمر التشغيل والسيرفر بيقوم دلوقتي!';
        } else {
            return '❌ اللوحة رفضت الأمر، اتأكد إن السيرفر مش شغال بالفعل.';
        }
    } catch (error) {
        if (error.response && error.response.status === 412) {
            return '⚠️ السيرفر شغال بالفعل أو بيعمل Start حالياً!';
        }
        return '❌ حصلت مشكلة في الاتصال باللوحة، اتأكد من صحة مفتاح الـ API.';
    }
}

bot.onText(/\/(start|بدأ|بدء)/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '⏳ جاري الاتصال باللوحة وتشغيل السيرفر...');
    const resultMessage = await startFalixServer();
    bot.sendMessage(chatId, resultMessage);
});

// --- 3. Keep-Alive ---
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// --- 4. Bedrock Bot (AFK) ---
function createBedrockBot() {
    const client = bedrock.createClient({
        host: 'radicalcraft1.falixsrv.me',
        port: 28508,
        username: 'VoltCraftBot',
        offline: true,
        version: '1.26.51'
    });

    client.on('spawn', () => console.log('Bedrock bot connected!'));
    client.on('disconnect', () => setTimeout(createBedrockBot, 5000));
    client.on('error', (err) => console.log(err));
}

createBedrockBot();
