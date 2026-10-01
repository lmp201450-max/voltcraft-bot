const mineflayer = require('mineflayer');
const http = require('http');

// خادم HTTP بسيط عشان ريندر يفضل يعمل Ping وما يقفلش الخدمة
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Minecraft Bot is running and keeping server alive!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP Server is listening on port ${PORT}`);
});

// دالة تشغيل بوت الماينكرفت مع إعادة الاتصال التلقائي
function createMinecraftBot() {
    console.log('Attempting to connect to Minecraft server...');
    
    const bot = mineflayer.createBot({
        host: 'radicalcraft.progamer.me',
        port: 43702,
        username: 'VoltCraftBot',
        version: false
    });

    bot.on('spawn', () => {
        console.log('Bot spawned successfully inside Minecraft server!');
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        console.log(`${username}: ${message}`);
    });

    bot.on('error', (err) => {
        console.log('Minecraft error encountered:', err);
    });

    bot.on('end', (reason) => {
        console.log(`Disconnected from server. Reason: ${reason}. Reconnecting in 5 seconds...`);
        setTimeout(() => {
            createMinecraftBot();
        }, 5000);
    });
}

// بدء تشغيل البوت
createMinecraftBot();
