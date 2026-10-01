const mineflayer = require('mineflayer');
const { Telegraf } = require('telegraf');

const bot = mineflayer.createBot({
    host: 'radicalcraft.progamer.mw',
    port: 43702,
    username: 'VoltCraftBot',
    version: false
});

bot.on('spawn', () => {
    console.log('تم دخول البوت وثباته في مكانه بنجاح');
});

bot.on('error', (err) => {
    console.log('حدث خطأ:', err);
});

bot.on('end', () => {
    console.log('تم قطع الاتصال، جاري إعادة المحاولة...');
    setTimeout(() => {
        process.exit(1);
    }, 5000);
});

const tgBot = new Telegraf('8656237005:AAHReANQpxDobIhC1oIX0gA2aYdLuqVEaoA');

tgBot.start((ctx) => {
    ctx.reply('أهلاً بيك ، البوت شغال ومتصل بالسيرفر تمام!');
});

tgBot.launch();
console.log('تم تشغيل بوت تليجرام بنجاح!');
