const express = require('express');
const axios = require('axios');
const bedrock = require('bedrock-protocol');
const { Telegraf } = require('telegraf');

// ================= الإعدادات المباشرة =================
const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = '8820559215:AAE8h59RJbtI66Q9p4LCH5V4NP2s4_-4XJI';
const FALIX_API_KEY = 'flx_live_Y0YRCavO3DHUjbMm0EAO2JjD9tvUy1aPF0otiRKb';
const FALIX_SERVER_ID = '3503676';

// بيانات السيرفر
const MINECRAFT_HOST = 'radicalcraft1.falixsrv.me';
const MINECRAFT_PORT = 28508;
const BOT_USERNAME = 'KidiCraftBot';

const bot = new Telegraf(TELEGRAM_TOKEN);
const app = express();

// ================= سيرفر Express لمنع Render من النوم =================
app.get('/', (req, res) => {
  res.send('VoltCraft Bot is running successfully!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// ================= دالة تشغيل السيرفر عبر Falix API =================
async function startFalixServer() {
  try {
    const response = await axios.post(
      `https://client.falixnodes.net/api/client/servers/${FALIX_SERVER_ID}/power`,
      { signal: 'start' },
      {
        headers: {
          'Authorization': `Bearer ${FALIX_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Falix API Error:', error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
}

// ================= دالة ربط بوت بيدروك بالسيرفر =================
function connectBedrockBot() {
  console.log(`Connecting Bedrock Bot to ${MINECRAFT_HOST}:${MINECRAFT_PORT}...`);
  
  const client = bedrock.createClient({
    host: MINECRAFT_HOST,
    port: MINECRAFT_PORT,
    username: BOT_USERNAME,
    offline: true
  });

  client.on('join', () => {
    console.log(`Bot ${BOT_USERNAME} connected to Minecraft server!`);
  });

  client.on('disconnect', (packet) => {
    console.log('Server requested disconnect:', packet);
  });

  client.on('error', (err) => {
    console.error('Bedrock Protocol Error:', err);
  });
}

// ================= أوامر بوت تليجرام =================
bot.start(async (ctx) => {
  await ctx.reply('⏳ جاري الاتصال باللوحة وتشغيل السيرفر...');

  const result = await startFalixServer();

  if (result.success) {
    await ctx.reply('✅ تم إرسال أمر التشغيل والسيرفر بيقوم دلوقتي!');
    setTimeout(() => {
      connectBedrockBot();
    }, 15000);
  } else {
    await ctx.reply('❌ حصلت مشكلة في الاتصال باللوحة، تأكد من صحة مفتاح الـ API.');
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
