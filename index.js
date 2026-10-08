const http = require('http');
http.createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

const bedrock = require('bedrock-protocol');

// إعدادات بوت ماين كرافت
const host = 'pixelrealm0.progamer.me';
const port = 19132;
const username = 'VoltCraft_Bot';

let messageInterval = null;

function createBot() {
    console.log('جاري الاتصال بسيرفر ماين كرافت...');

    const client = bedrock.createClient({
        host: host,
        port: port,
        username: username,
        offline: false,
        skipPacks: true,        // تخطي تحميل ملفات الموارد والمودات للدخول السريع
        timeout: 120000,        // مهلة اتصال واسعة لمنع الـ Timeout
        profilesFolder: './controls'
    });

    client.on('spawn', () => {
        console.log('✅ تم دخول البوت السيرفر بنجاح وهو شغال حالياً!');

        if (messageInterval) clearInterval(messageInterval);
        
        // إرسال الصلاة على النبي كل 5 دقائق تلقائياً في الشات
        messageInterval = setInterval(() => {
            try {
                client.queue('text', {
                    type: 'chat',
                    needs_translation: false,
                    source_name: client.username,
                    xuid: '',
                    platform_chat_id: '',
                    message: 'اللهم صل على سيدنا محمد'
                });
                console.log('💬 تم إرسال الصلاة على النبي في الشات.');
            } catch (err) {
                console.error('خطأ أثناء إرسال الرسالة:', err.message);
            }
        }, 5 * 60 * 1000);
    });

    client.on('close', () => {
        console.log('⚠️ الاتصال اتفصل، جاري إعادة المحاولة خلال 10 ثواني...');
        if (messageInterval) clearInterval(messageInterval);
        setTimeout(createBot, 10000);
    });

    client.on('error', (err) => {
        console.error('❌ حدث خطأ في الاتصال:', err.message);
    });
}

createBot();
