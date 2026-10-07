const express = require('express');
const axios = require('axios');
const { Telegraf } = require('telegraf');

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = '8820559215:AAE8h59RJbtI66Q9p4LCH5V4NP2s4_-4XJI';
const FALIX_API_KEY = 'flx_live_Y0YRCavO3DHUjbMm0EAO2JjD9tvUy1aPF0otiRKb';
const FALIX_SERVER_ID = '3503676';

const bot = new Telegraf(TELEGRAM_TOKEN);
const app = express();

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

async function startFalixServer() {
  try {
    const response = await axios({
      method: 'post',
      url: `https://client.falixnodes.net/api/client/servers/${FALIX_SERVER_ID}/power`,
      headers: {
        'Authorization': `Bearer ${FALIX_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
      },
      data: JSON.stringify({ signal: 'start' }),
      timeout: 10000
    });
    return { success: true };
  } catch (error) {
    // لو Cloudflare بلك الـ IP هنجرب السيرفر البديل للوحة
    try {
      const altResponse = await axios({
        method: 'post',
        url: `https://panel.falixnodes.net/api/client/servers/${FALIX_SERVER_ID}/power`,
        headers: {
          'Authorization': `Bearer ${FALIX_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
        },
        data: JSON.stringify({ signal: 'start' }),
        timeout: 10000
      });
      return { success: true };
    } catch (err) {
      console.error('Falix Error:', err.message);
      return { success: false };
    }
  }
}

bot.start(async (ctx) => {
  await ctx.reply('⏳ جاري الاتصال باللوحة وتشغيل السيرفر...');
  const result = await startFalixServer();
  if (result.success) {
    await ctx.reply('✅ تم إرسال أمر التشغيل بنجاح! السيرفر بيقوم دلوقتي.');
  } else {
    await ctx.reply('❌ حصلت مشكلة في الاتصال باللوحة، تأكد من صحة مفتاح الـ API.');
  }
});

bot.launch();
