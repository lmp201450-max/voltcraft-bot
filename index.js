const http = require('http');
http.createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

const bedrock = require('bedrock-protocol');

// بيانات السيرفر الخاص بيك
const host = 'pixelrealm0.progamer.me';
const port = 30037;
const username = 'VoltCraft_Bot';

let messageInterval = null;

function createBot() {
    console.log('جاري الاتصال بالسيرفر...');

    const client = bedrock.createClient({
        host: host,
        port: port,
        username: username,
        offline: false,
        profilesFolder: './controls'
    });

    client.on('spawn', () => {
        console.log('✅ تم دخول البوت للسيرفر بنجاح!');

        if (messageInterval) clearInterval(messageInterval);

        messageInterval = setInterval(() => {
            try {
                client.queue('text', {
                    type: 'chat',
                    needs_translation: false,
                    source_name: client.username,
                    xuid: '',
                    platform_chat_id: '',
                    message: 'أهلاً بيكم يا شباب محمد'
                });

                console.log('📨 تم إرسال الرسالة بنجاح');
            } catch (err) {
                console.error('❌ حصل خطأ أثناء إرسال الرسالة:', err.message);
            }
        }, 5 * 60 * 1000);
    });

    client.on('close', () => {
        console.log('⚠️ الاتصال جاري إعادة المحاولة خلال 10 ثواني...');
        
        if (messageInterval) clearInterval(messageInterval);

        setTimeout(createBot, 10000);
    });

    client.on('error', (err) => {
        console.error('❌ حدث خطأ في الاتصال:', err.message);
    });
}

createBot();
