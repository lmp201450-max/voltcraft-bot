const express = require('express');
const axios = require('axios');
const { Telegraf } = require('telegraf');

// ================= الإعدادات =================
const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = '8820559215:AAE8h59RJbtI66Q9p4LCH5V4NP2s4_-4XJI';
const FALIX_API_KEY = 'flx_live_Y0YRCavO3DHUjbMm0EAO2JjD9tvUy1aPF0otiRKb';
const FALIX_SERVER_ID = '3503676';

const bot = new Telegraf(TELEGRAM_TOKEN);
const app = express();

app.get('/', (req, res) => {
  res.send('VoltCraft Bot is running successfully!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// ================= دالة تشغيل السيرفر =================
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

// ================= أوامر تليجرام =================
bot.start(async (ctx) => {
  await ctx.reply('⏳ جاري الاتصال باللوحة وتشغيل السيرفر...');

  const result = await startFalixServer();

  if (result.success) {
    await ctx.reply('✅ تم إرسال أمر التشغيل! السيرفر بيقوم دلوقتي وهيفضل أونلاين.');
  } else {
    await ctx.reply('❌ حصلت مشكلة في الاتصال باللوحة، تأكد من مفتاح الـ API.');
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
