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
  username: 'RadicalGuard6464',
  offline: true
});

bot.on('spawn', () => {
  console.log('تم دخول البوت بنجاح داخل سيرفر راديكال كرافت');
  
  // حركة خفيفة لمنع الخمول + كتابة ذكر في الشات كل دقيقة ونصف
  setInterval(() => {
    // حركة بسيطة للأمام والخلف بخفة
    bot.setControlState('forward', true);
    setTimeout(() => {
      bot.setControlState('forward', false);
      bot.setControlState('back', true);
      setTimeout(() => bot.setControlState('back', false), 400);
    }, 400);

    // كتابة الصلاة على النبي في الشات
    bot.chat('صلى على سيدنا محمد ﷺ');
  }, 90000); // كل 90 ثانية عشان ميعملش سبام في الشات
});

bot.on('death', () => {
  console.log('البوت مات، جاري إعادة الريسبن...');
  bot.respawn();
});

bot.on('error', (err) => {
  console.log('خطأ:', err);
});

bot.on('end', () => {
  console.log('انقطع الاتصال، يتم إعادة المحاولة...');
  setTimeout(() => process.exit(1), 5000);
});
