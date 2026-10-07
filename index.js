const bedrock = require('bedrock-protocol');
const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 10000;

// --- 1. البيانات الخاصة بك ---
const TELEGRAM_TOKEN = '8820559215:AAE8h59RJbtI66Q9p4LCH5V4NP2s4_-4XJI';
// ضع مفتاح الـ API الجديد من FalixNodes هنا مكان العبارة:
const FALIX_API_KEY = 'حط_مفتاح_الـ_API_الجديد_هنا'; 
const SERVER_ID = '3503676'; // الـ Server ID بتاعك جاهز

const PANEL_URL = 'https://client.falixnodes.net';

// تشغيل بوت تيليجرام
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// --- 2. وظيفة تشغيل السيرفر ---
async function startFalixServer() {
    try {
        const startUrl = `${PANEL_URL}/api/client/servers/${SERVER_ID}/power`;
        
        const res = await axios.post(startUrl, { signal: 'start' }, {
            headers: {
                'Authorization': `Bearer ${FALIX_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (res.status === 204 || res.status === 200) {
            return '✅ تم إرسال أمر التشغيل للسيرفر بنجاح!';
        } else {
            return '❌ حدث خطأ أثناء تشغيل السيرفر.';
        }
    } catch (error) {
        return '❌ حدث خطأ في الاتصال، تأكد من صحة مفتاح الـ API Key.';
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
    console.log(`Web server running on port ${PORT}`);
});

// --- 4. بوت البدروك (AFK Bot) ---
function createBedrockBot() {
    const client = bedrock.createClient({
        host: 'radicalcraft1.falixsrv.me',
        port: 28508,
        username: 'VoltCraftBot',
        offline: true,
        version: '1.26.51'
    });

    client.on('spawn', () => {
        console.log('Bot connected to Bedrock server successfully!');
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
