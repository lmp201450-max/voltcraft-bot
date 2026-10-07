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
  res.send('VoltCraft Bot is running!');
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// ================= دالة التشغيل =================
async function startFalixServer() {
  try {
    const response = await axios({
      method: 'post',
      url: `https://client.falixnodes.net/api/client/servers/${FALIX_SERVER_ID}/power`,
      data: { signal: 'start' },
      headers: {
        'Authorization': `Bearer ${FALIX_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Origin': 'https://client.falixnodes.net',
        'Referer': `https://client.falixnodes.net/server/${FALIX_SERVER_ID}`
      },
      timeout: 10000
    });
    return { success: true };
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
    return { success: false };
  }
}

// ================= أوامر تليجرام =================
bot.start(async (ctx) => {
  await ctx.reply('⏳ جاري إرسال أمر التشغيل...');

  let result = await startFalixServer();
  
  // لو فشلت المرة الأولى من كود حماية اللوحة، يعيد المحاولة تلقائياً بعد ثانية
  if (!result.success) {
    await new Promise(res => setTimeout(res, 1500));
    result = await startFalixServer();
  }

  if (result.success) {
    await ctx.reply('✅ تم إرسال أمر التشغيل بنجاح والسيرفر بيقوم دلوقتي!');
  } else {
    await ctx.reply('❌ اللوحة حالياً عاملة الحماية (Cloudflare)، جرب كمان شوية أو شغلها مرة من الموقع.');
  }
});

bot.launch();
