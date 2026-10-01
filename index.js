const mineflayer = require('mineflayer');
const { Telegraf } = require('telegraf');

const tgBot = new Telegraf('8656237005:AAH4xQdxdsnln1t0LXgAz4DyUbEwn7fA87w');

tgBot.start((ctx) => {
    ctx.reply('تم التشغيل');
});

tgBot.launch();
console.log('تم تشغيل بوت التليجرام بنجاح!');

function createMinecraftBot() {
    const bot = mineflayer.createBot({
        host: 'radicalcraft.progamer.mw',
        port: 43702,
        username: 'VoltCraftBot',
        version: false
    });

    bot.on('spawn', () => {
        console.log('تم دخول البوت وبناء في مكانه بنجاح.');
    });

    bot.on('error', (err) => {
        console.log('حدث خطأ في الماينكرفت:', err);
    });

    bot.on('end', () => {
        console.log('تم قطع الاتصال من السيرفر، جاري إعادة المحاولة بعد 5 ثوانٍ...');
        setTimeout(() => {
            createMinecraftBot();
        }, 5000);
    });
}

createMinecraftBot();
