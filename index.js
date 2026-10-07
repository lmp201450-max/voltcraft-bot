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

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// ================= دالة التشغيل عبر بروكسي لتجاوز الحظر =================
async function startFalixServer() {
  const targetUrl = `https://client.falixnodes.net/api/client/servers/${FALIX_SERVER_ID}/power`;
  // استخدام وكيل CorsProxy لتخطي حظر Cloudflare على Render
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

  try {
    const response = await axios.post(
      proxyUrl,
      { signal: 'start' },
      {
        headers: {
          'Authorization': `Bearer ${FALIX_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Falix API Error:', error.response ? error.response.status : error.message);
    return { success: false, error: error.message };
  }
}

// ================= أوامر تليجرام =================
bot.start(async (ctx) => {
  await ctx.reply('⏳ جاري الاتصال باللوحة وتشغيل السيرفر...');

  const result = await startFalixServer();

  if (result.success) {
    await ctx.reply('✅ تم إرسال أمر التشغيل بنجاح! السيرفر بيقوم دلوقتي وهيفضل أونلاين.');
  } else {
    await ctx.reply('❌ حصلت مشكلة في الاتصال باللوحة، تأكد من صحة مفتاح الـ API.');
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
