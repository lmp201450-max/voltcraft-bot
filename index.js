const mineflayer = require('mineflayer');
const http = require('http');

// خادم HTTP للحفاظ على عمل خدمة Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Minecraft Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP Server is listening on port ${PORT}`);
});

function createMinecraftBot() {
    console.log('Attempting to connect to Minecraft server...');
    
    const bot = mineflayer.createBot({
        host: 'radicalcraft.progamer.me',
        port: 43702,
        username: 'VoltCraftBot',
        version: '1.20.4' // تحديد الإصدار بدقة ليوافق إعدادات السيرفر والبلاجنز
    });

    bot.on('spawn', () => {
        console.log('Bot spawned successfully inside Minecraft server!');
    });

    bot.on('error', (err) => {
        console.log('Minecraft error encountered:', err);
    });

    bot.on('end', (reason) => {
        console.log(`Disconnected from server. Reason: ${reason}. Reconnecting in 10 seconds...`);
        setTimeout(() => {
            createMinecraftBot();
        }, 10000); // زيادة الوقت قليلاً لتجنب الضغط على بلاجن الحماية
    });
}

createMinecraftBot();
