const http = require('http');
const mineflayer = require('mineflayer');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web server is listening on port ${PORT}`);
});

const bot = mineflayer.createBot({
  host: 'radicalcraft.progamer.me',
  port: 43702,
  username: 'Mik850018@gmail.com',
  auth: 'microsoft'
});

bot.on('spawn', () => {
  console.log('تم دخول البوت بنجاح داخل سيرفر راديكال كرافت!');
  
  // حركة خفيفة كل دقيقة عشان الخمول
  setInterval(() => {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
  }, 60000);
});

bot.on('error', (err) => {
  console.log('خطأ:', err);
});
