const mineflayer = require('mineflayer');
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Minecraft Bot is running!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP Server is listening on port ${PORT}`);
});

function createMinecraftBot() {
    console.log('Attempting to connect to Minecraft server...');

    const bot = mineflayer.createBot({
        host: 'radicalcraft.falixsrv.me',
        port: 21265,
        username: 'VoltCraftBot',
        version: '1.20.4'
    });

    bot.on('spawn', () => {
        console.log('Bot spawned successfully inside Minecraft server!');

        setInterval(() => {
            bot.chat('اللهم صل على سيدنا محمد');
            bot.setControlState('jump', true);
            setTimeout(() => {
                bot.setControlState('jump', false);
            }, 500);
        }, 300000);
    });

    bot.on('error', (err) => {
        console.log('Minecraft error encountered:', err);
    });

    bot.on('end', (reason) => {
        console.log(`Disconnected from server. Reason: ${reason}. Reconnecting...`);
        setTimeout(() => {
            createMinecraftBot();
        }, 10000);
    });
}

createMinecraftBot();
