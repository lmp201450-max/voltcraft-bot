const bedrock = require('bedrock-protocol');

// بيانات السيرفر الخاصة بك من اللوحة
const host = 'pixelrealm0.progamer.me';
const port = 19132;
const version = '1.20.51'; // إصدار السيرفر المحدد
const username = 'VoltCraft_Bot';

let messageInterval = null;

function createBot() {
    console.log('جاري الاتصال بالسيرفر...');

    const client = bedrock.createClient({
        host: host,
        port: port,
        username: username,
        version: version,
        offline: false, // للتسجيل بحساب Microsoft وتخطي حماية البورت
        profilesFolder: './controls'
    });

    client.on('spawn', () => {
        console.log('✅ تم دخول البوت السيرفر بنجاح وهو شغال حالياً!');

        // إرسال رسالة كل 5 دقائق (300,000 مللي ثانية)
        if (messageInterval) clearInterval(messageInterval);
        
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
        }, 5 * 60 * 1000); // كل 5 دقائق
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
