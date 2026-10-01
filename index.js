const mineflayer = require('mineflayer');
const { Telegraf } = require('telegraf');
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

const tgBot = new Telegraf('8656237005:AAFjcErQshfbMrVdGbHBA-_E5JfVIQQt5tA');

tgBot.start((ctx) => {
    ctx.reply('Bot is running');
});

// تشغيل البوت مع تأمين الاتصال ضد السقوط بسبب الشبكة
try {
    tgBot.launch();
    console.log('Telegram bot started successfully!');
} catch (err) {
    console.log('Telegram launch error:', err);
}

// إيقاف آمن للروبوت
process.once('SIGINT', () => tgBot.stop('SIGINT'));
process.once('SIGTERM', () => tgBot.stop('SIGTERM'));

function createMinecraftBot() {
    const bot = mineflayer.createBot({
        host: 'radicalcraft.progamer.me',
        port: 43702,
        username: 'VoltCraftBot',
        version: false
    });

    bot.on('spawn', () => {
        console.log('Bot spawned successfully.');
    });

    bot.on('error', (err) => {
        console.log('Minecraft error:', err);
    });

    bot.on('end', () => {
        console.log('Disconnected from server, reconnecting in 5 seconds...');
        setTimeout(() => {
            createMinecraftBot();
        }, 5000);
    });
}

createMinecraftBot();
