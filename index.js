const mineflayer = require('mineflayer');
const { Telegraf } = require('telegraf');
const http = require('http');

// سيرفر ويب بسيط عشان Render يفضل مثبت البوت وما يقفلوش
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

const tgBot = new Telegraf('8656237005:AAHReANQpXDoblhC1olX0gA2aYdLuqVEaoA');

tgBot.start((ctx) => {
    ctx.reply('تم التشغيل');
});

tgBot.launch();
console.log('تم تشغيل بوت التليجرام بنجاح!');

function createMinecraftBot() {
    const bot = mineflayer.createBot({
        host: 'radicalcraft.progamer.me',
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
