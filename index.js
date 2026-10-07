const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// سيرفر ويب بسيط عشان Render ما ينامش (Keep-Alive)
app.get('/', (req, res) => {
    res.send('Bedrock Bot is running and alive!');
});

app.listen(PORT, () => {
    console.log(`Web server is running on port ${PORT}`);
});

// دالة اتصال بوت البيدروك
function createBedrockBot() {
    const client = bedrock.createClient({
        host: 'pixelrealm0.progamer.me',   // آيباد السيرفر الصحيح
        port: 19132,                       // بورت السيرفر (تأكد منه لو مختلف في اللوحة)
        username: 'VoltCraftBot',          // اسم البوت داخل السيرفر
        offline: true,                     // وضع الأوفلاين للاتصال بالسيرفر
        version: '1.26.51'                 // إصدار السيرفر المطلوب[span_1](start_span)[span_1](end_span)
    });

    client.on('spawn', () => {
        console.log('Bot connected to Bedrock server successfully!');
    });

    client.on('text', (packet) => {
        console.log(`[Chat] ${packet.sourceName}: ${packet.message}`);
    });

    client.on('disconnect', (packet) => {
        console.log('Bot disconnected:', packet);
        setTimeout(() => {
            createBedrockBot();
        }, 5000); // إعادة محاولة الاتصال بعد 5 ثواني لو فصل
    });

    client.on('error', (err) => {
        console.log('Bot encountered an error:', err);
    });
}

createBedrockBot();
