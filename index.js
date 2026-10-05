const mineflayer = require('mineflayer');
const express = require('express');

// إعداد سرفر الويب عشان Render ما يقفلش البوت
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send('VoltCraftBot is running and alive!');
});

app.listen(PORT, () => {
    console.log(`Web server is running on port ${PORT}`);
});

// دالة الاتصال بسيرفر ماينكرافت
function createBot() {
    const bot = mineflayer.createBot({
        host: 'radicalcraft.play.hosting', // عنوان السيرفر
        port: 25777,                      // بورت الجافا الأساسي الصحيح
        version: '1.21.11',               // إصدار السيرفر المتطابق
        username: 'VoltCraftBot'          // اسم البوت داخل السيرفر
    });

    bot.on('spawn', () => {
        console.log('Bot connected to Minecraft server successfully!');
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        console.log(`[Chat] ${username}: ${message}`);
    });

    bot.on('end', () => {
        console.log('Bot disconnected. Reconnecting in 5 seconds...');
        setTimeout(() => {
            createBot();
        }, 5000);
    });

    bot.on('error', (err) => {
        console.log('Bot encountered an error:', err);
    });
}

createBot();
