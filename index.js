const mineflayer = require('mineflayer');

function createMinecraftBot() {
    console.log('Attempting to connect to Minecraft server...');

    const bot = mineflayer.createBot({
        host: 'radicalcraft.progamer.me',
        port: 43702,
        username: 'VoltCraftBot'
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
        }, 5000);
    });
}

createMinecraftBot();
