const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'radicalcraft.progamer.me', // إبي السيرفر بتاعك
  port: 43702,                    // البورت بتاع السيرفر
  username: 'VoltCraftBot',       // اسم البوت جوه اللعبة (تقدر تغيره هنا لو حابب)
  version: false                  // عشان يحدد الإصدار تلقائي
});

bot.on('spawn', () => {
  console.log('تم دخول البوت وثباته في مكانه بنجاح!');
});

// التعامل مع الأخطاء عشان ما يفصلش الكونسول
bot.on('error', (err) => {
  console.log('حدث خطأ:', err);
});

// إعادة الاتصال لو البوت خرج أو السيرفر عمل ريستارت
bot.on('end', () => {
  console.log('تم قطع الاتصال، جاري إعادة المحاولة...');
  setTimeout(() => {
    process.exit(1); // بيخلي رندر يعيد تشغيل البوت تلقائياً
  }, 5000);
});
