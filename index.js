
require('dotenv').config();

const express = require('express');
const { Bot, InlineKeyboard } = require('grammy');
const { randomBytes } = require('crypto');
const { pool, initDatabase, getSetting, setSetting } = require('./database');

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = new Set(
  (process.env.ADMIN_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || randomBytes(24).toString('hex');
const PUBLISH_INTERVAL_MS = 5 * 60 * 1000;

if (!TOKEN || TOKEN === 'PUT_NEW_BOT_TOKEN_HERE') {
  throw new Error('BOT_TOKEN is missing. Add a NEW token in your environment variables.');
}
if (ADMIN_IDS.size === 0) {
  throw new Error('ADMIN_IDS is missing. Add your Telegram numeric user ID.');
}

const bot = new Bot(TOKEN);
const app = express();
const sessions = new Map();
let publishCheckRunning = false;

function isAdmin(userId) {
  return Boolean(userId) && ADMIN_IDS.has(String(userId));
}

function mainKeyboard() {
  return new InlineKeyboard()
    .text('📢 النشر', 'screen:publishing').text('👥 الجروبات', 'screen:groups').row()
    .text('📝 المنشورات', 'screen:posts').text('💬 الردود', 'screen:replies').row()
    .text('📊 الحالة', 'screen:status').row()
    .text('▶️ تشغيل/إيقاف النشر', 'toggle:publish').row()
    .text('▶️ تشغيل/إيقاف الردود', 'toggle:replies');
}

function backKeyboard() {
  return new InlineKeyboard().text('⬅️ القائمة الرئيسية', 'screen:home');
}

function cancelKeyboard() {
  return new InlineKeyboard().text('إلغاء', 'action:cancel');
}

async function safeEdit(ctx, text, reply_markup) {
  try {
    await ctx.editMessageText(text, { reply_markup });
  } catch (error) {
    if (!String(error?.description || error?.message || '').includes('message is not modified')) {
      await ctx.reply(text, { reply_markup }).catch(() => {});
    }
  }
}

async function showHome(ctx, edit = false) {
  const text = 'لوحة تحكم بوت النشر التلقائي\n\nاختار العملية من الأزرار:';
  if (edit) return safeEdit(ctx, text, mainKeyboard());
  return ctx.reply(text, { reply_markup: mainKeyboard() });
}

async function showGroups(ctx) {
  const result = await pool.query('SELECT chat_id, title FROM groups_list ORDER BY added_at DESC LIMIT 30');
  const keyboard = new InlineKeyboard();

  if (result.rowCount) {
    for (const group of result.rows) {
      keyboard.text(`🗑 حذف: ${String(group.title).slice(0, 25)}`, `group:delete:${group.chat_id}`).row();
    }
  }

  keyboard.text('⬅️ القائمة الرئيسية', 'screen:home');

  const lines = result.rows.map((group, index) => `${index + 1}. ${group.title} (${group.chat_id})`);
  const text = `👥 الجروبات المسجلة: ${result.rowCount}\n\n${lines.join('\n') || 'لا توجد جروبات مسجلة حالياً.'}\n\nلإضافة جروب: أضف البوت للجروب كمشرف، ثم أرسل الأمر /register داخل الجروب.`;

  return safeEdit(ctx, text, keyboard);
}

async function showPosts(ctx) {
  const result = await pool.query('SELECT id, body, enabled FROM posts ORDER BY id DESC LIMIT 20');
  const keyboard = new InlineKeyboard();

  for (const post of result.rows) {
    const status = post.enabled ? '✅' : '⏸';
    keyboard.text(`${status} تعديل منشور ${post.id}`, `post:edit:${post.id}`)
      .text('🗑 حذف', `post:delete:${post.id}`).row();
  }

  keyboard.text('➕ إضافة منشور', 'action:add_post').row();
  keyboard.text('⬅️ القائمة الرئيسية', 'screen:home');

  const lines = result.rows.map((post) => `${post.enabled ? '✅' : '⏸'} #${post.id}: ${post.body.replace(/\s+/g, ' ').slice(0, 65)}`);
  const text = `📝 المنشورات المحفوظة: ${result.rowCount}\n\n${lines.join('\n') || 'لسه مفيش منشورات.'}\n\nالبوت يرسل منشوراً كل 5 دقائق بالتبادل بين المنشورات المفعلة.`;

  return safeEdit(ctx, text, keyboard);
}

async function showReplies(ctx) {
  const result = await pool.query('SELECT id, keyword, response, enabled FROM auto_replies ORDER BY id DESC LIMIT 20');
  const keyboard = new InlineKeyboard();

  for (const reply of result.rows) {
    const status = reply.enabled ? '✅' : '⏸';
    keyboard.text(`${status} تعديل: ${String(reply.keyword).slice(0, 18)}`, `reply:edit:${reply.id}`)
      .text('🗑 حذف', `reply:delete:${reply.id}`).row();
  }

  keyboard.text('➕ إضافة رد تلقائي', 'action:add_reply').row();
  keyboard.text('⬅️ القائمة الرئيسية', 'screen:home');

  const lines = result.rows.map((reply) => `${reply.enabled ? '✅' : '⏸'} #${reply.id} كلمة: ${reply.keyword} | الرد: ${reply.response.replace(/\s+/g, ' ').slice(0, 45)}`);
  const text = `💬 الردود التلقائية: ${result.rowCount}\n\n${lines.join('\n') || 'لا توجد ردود.'}\n\nالردود تعمل في الخاص فقط. الإضافة أو التعديل تكون بالشكل:\nالكلمة | نص الرد`;

  return safeEdit(ctx, text, keyboard);
}

async function showStatus(ctx) {
  const [groups, posts, replies, publishEnabled, repliesEnabled] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM groups_list'),
    pool.query('SELECT COUNT(*)::int AS count FROM posts WHERE enabled = TRUE'),
    pool.query('SELECT COUNT(*)::int AS count FROM auto_replies WHERE enabled = TRUE'),
    getSetting('publish_enabled', 'true'),
    getSetting('replies_enabled', 'true')
  ]);

  const text = `📊 حالة البوت\n\nالجروبات: ${groups.rows[0].count}\nالمنشورات المفعلة: ${posts.rows[0].count}\nالردود المفعلة: ${replies.rows[0].count}\nالنشر التلقائي: ${publishEnabled === 'true' ? 'يعمل ✅' : 'متوقف ⏸'}\nالردود التلقائية: ${repliesEnabled === 'true' ? 'تعمل ✅' : 'متوقفة ⏸'}\nالفاصل بين المنشورات: 5 دقائق`;

  return safeEdit(ctx, text, backKeyboard());
}

async function showPublishing(ctx) {
  const [publishEnabled, count] = await Promise.all([
    getSetting('publish_enabled', 'true'),
    pool.query('SELECT COUNT(*)::int AS count FROM posts WHERE enabled = TRUE')
  ]);

  const text = `📢 إعدادات النشر\n\nالحالة: ${publishEnabled === 'true' ? 'مفعل ✅' : 'متوقف ⏸'}\nالمنشورات المفعلة: ${count.rows[0].count}\nالفاصل: كل 5 دقائق\n\nأضف البوت كمشرف في الجروب، ثم أرسل /register داخل الجروب لتسجيله.`;

  return safeEdit(ctx, text, backKeyboard());
}

function splitLongText(value, limit = 4000) {
  let remaining = String(value || '').trim();
  const chunks = [];

  while (remaining.length > limit) {
    let cut = remaining.lastIndexOf('\n', limit);
    if (cut < limit * 0.5) cut = limit;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

async function publishNextPost() {
  const posts = await pool.query('SELECT id, body FROM posts WHERE enabled = TRUE ORDER BY id ASC');
  if (!posts.rowCount) return;

  const lastId = await getSetting('last_post_id', '0');
  let post = posts.rows.find((item) => BigInt(item.id) > BigInt(lastId));
  if (!post) post = posts.rows[0];

  await setSetting('last_post_id', post.id);

  const groups = await pool.query('SELECT chat_id, title FROM groups_list ORDER BY added_at ASC');

  if (!groups.rowCount) {
    console.log('No registered groups; skipped scheduled post.');
    return;
  }

  const chunks = splitLongText(post.body);

  for (const group of groups.rows) {
    try {
      for (const chunk of chunks) {
        await bot.api.sendMessage(String(group.chat_id), chunk, {
          link_preview_options: { is_disabled: false }
        });
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } catch (error) {
      console.error(`Failed sending post to ${group.title} (${group.chat_id}):`, error.message);
    }
  }

  console.log(`Published post #${post.id} to ${groups.rowCount} group(s).`);
}

async function schedulerCheck() {
  if (publishCheckRunning) return;
  publishCheckRunning = true;

  try {
    const enabled = await getSetting('publish_enabled', 'true');
    if (enabled !== 'true') return;

    const now = Date.now();
    const nextAt = Number(await getSetting('next_publish_at', '0'));

    if (!nextAt) {
      await setSetting('next_publish_at', now + PUBLISH_INTERVAL_MS);
      return;
    }

    if (now >= nextAt) {
      await setSetting('next_publish_at', now + PUBLISH_INTERVAL_MS);
      await publishNextPost();
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  } finally {
    publishCheckRunning = false;
  }
}

bot.command('start', async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply('البوت مخصص للإدارة فقط.');
  }
  return showHome(ctx);
});

bot.command('cancel', async (ctx) => {
  if (!isAdmin(ctx.from?.id)) return;
  sessions.delete(String(ctx.from.id));
  await ctx.reply('تم إلغاء العملية.', { reply_markup: mainKeyboard() });
});

bot.command('register', async (ctx) => {
  if (!['group', 'supergroup'].includes(ctx.chat.type)) {
    return ctx.reply('أرسل /register داخل الجروب الذي تريد إضافته.');
  }

  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply('فقط مدير البوت يستطيع تسجيل الجروبات.');
  }

  try {
    const botMember = await ctx.api.getChatMember(ctx.chat.id, bot.botInfo.id);

    if (!['administrator', 'creator'].includes(botMember.status)) {
      return ctx.reply('ارفع البوت مشرفاً في الجروب مع صلاحية إرسال الرسائل، ثم أعد /register.');
    }

    await pool.query(
      `INSERT INTO groups_list (chat_id, title) VALUES ($1, $2)
       ON CONFLICT (chat_id) DO UPDATE SET title = EXCLUDED.title`,
      [String(ctx.chat.id), ctx.chat.title || 'جروب تيليجرام']
    );

    return ctx.reply('✅ تم تسجيل الجروب بنجاح. سيبدأ النشر التلقائي كل 5 دقائق عند تفعيل النشر.');
  } catch (error) {
    console.error('Group registration error:', error);
    return ctx.reply('لم أستطع تسجيل الجروب. تأكد أن البوت مشرف وأن قاعدة البيانات تعمل.');
  }
});

bot.command('unregister', async (ctx) => {
  if (!['group', 'supergroup'].includes(ctx.chat.type) || !isAdmin(ctx.from?.id)) return;
  await pool.query('DELETE FROM groups_list WHERE chat_id = $1', [String(ctx.chat.id)]);
  return ctx.reply('تم حذف هذا الجروب من قائمة النشر.');
});

bot.on('callback_query:data', async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.answerCallbackQuery({ text: 'غير مسموح.' });
    return;
  }

  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  if (data === 'screen:home') return showHome(ctx, true);
  if (data === 'screen:groups') return showGroups(ctx);
  if (data === 'screen:posts') return showPosts(ctx);
  if (data === 'screen:replies') return showReplies(ctx);
  if (data === 'screen:status') return showStatus(ctx);
  if (data === 'screen:publishing') return showPublishing(ctx);

  if (data === 'toggle:publish' || data === 'toggle:replies') {
    const key = data === 'toggle:publish' ? 'publish_enabled' : 'replies_enabled';
    const current = await getSetting(key, 'true');
    await setSetting(key, current === 'true' ? 'false' : 'true');
    return showHome(ctx, true);
  }

  if (data === 'action:cancel') {
    sessions.delete(String(ctx.from.id));
    return showHome(ctx, true);
  }

  if (data === 'action:add_post') {
    sessions.set(String(ctx.from.id), { type: 'add_post' });
    return safeEdit(ctx, 'ابعت نص المنشور الآن. تقدر تبعت نص طويل، والبوت هيقسمه لرسائل مناسبة لتيليجرام.\n\nللإلغاء أرسل /cancel.', cancelKeyboard());
  }

  if (data === 'action:add_reply') {
    sessions.set(String(ctx.from.id), { type: 'add_reply' });
    return safeEdit(ctx, 'ابعت الكلمة والرد في رسالة واحدة بالشكل ده:\nالكلمة | نص الرد\n\nللإلغاء أرسل /cancel.', cancelKeyboard());
  }

  const groupDelete = data.match(/^group:delete:(-?\d+)$/);
  if (groupDelete) {
    await pool.query('DELETE FROM groups_list WHERE chat_id = $1', [groupDelete[1]]);
    return showGroups(ctx);
  }

  const postDelete = data.match(/^post:delete:(\d+)$/);
  if (postDelete) {
    await pool.query('DELETE FROM posts WHERE id = $1', [postDelete[1]]);
    return showPosts(ctx);
  }

  const postEdit = data.match(/^post:edit:(\d+)$/);
  if (postEdit) {
    const found = await pool.query('SELECT id FROM posts WHERE id = $1', [postEdit[1]]);
    if (!found.rowCount) return showPosts(ctx);
    sessions.set(String(ctx.from.id), { type: 'edit_post', id: postEdit[1] });
    return safeEdit(ctx, `ابعت النص الجديد للمنشور رقم ${postEdit[1]}.\n\nللإلغاء أرسل /cancel.`, cancelKeyboard());
  }

  const replyDelete = data.match(/^reply:delete:(\d+)$/);
  if (replyDelete) {
    await pool.query('DELETE FROM auto_replies WHERE id = $1', [replyDelete[1]]);
    return showReplies(ctx);
  }

  const replyEdit = data.match(/^reply:edit:(\d+)$/);
  if (replyEdit) {
    const found = await pool.query('SELECT id FROM auto_replies WHERE id = $1', [replyEdit[1]]);
    if (!found.rowCount) return showReplies(ctx);
    sessions.set(String(ctx.from.id), { type: 'edit_reply', id: replyEdit[1] });
    return safeEdit(ctx, `ابعت الكلمة والرد الجديدين للرد رقم ${replyEdit[1]} بالشكل:\nالكلمة | نص الرد\n\nللإلغاء أرسل /cancel.`, cancelKeyboard());
  }
});

bot.on('message:text', async (ctx) => {
  if (ctx.chat.type !== 'private' || !ctx.from || ctx.from.is_bot) return;

  const admin = isAdmin(ctx.from.id);
  const session = admin ? sessions.get(String(ctx.from.id)) : null;

  if (session && !ctx.message.text.startsWith('/')) {
    const text = ctx.message.text.trim();

    try {
      if (session.type === 'add_post') {
        if (!text) return ctx.reply('النص فارغ. ابعت نص المنشور أو /cancel.');
        await pool.query('INSERT INTO posts (body) VALUES ($1)', [text]);
        sessions.delete(String(ctx.from.id));
        return ctx.reply('✅ تم حفظ المنشور.', { reply_markup: mainKeyboard() });
      }

      if (session.type === 'edit_post') {
        if (!text) return ctx.reply('النص فارغ. ابعت النص الجديد أو /cancel.');
        await pool.query('UPDATE posts SET body = $1 WHERE id = $2', [text, session.id]);
        sessions.delete(String(ctx.from.id));
        return ctx.reply('✅ تم تعديل المنشور.', { reply_markup: mainKeyboard() });
      }

      if (session.type === 'add_reply' || session.type === 'edit_reply') {
        const separator = text.indexOf('|');

        if (separator < 1 || !text.slice(separator + 1).trim()) {
          return ctx.reply('الصيغة غير صحيحة. استخدم:\nالكلمة | نص الرد');
        }

        const keyword = text.slice(0, separator).trim();
        const response = text.slice(separator + 1).trim();

        if (session.type === 'add_reply') {
          await pool.query('INSERT INTO auto_replies (keyword, response) VALUES ($1, $2)', [keyword, response]);
        } else {
          await pool.query('UPDATE auto_replies SET keyword = $1, response = $2 WHERE id = $3', [keyword, response, session.id]);
        }

        sessions.delete(String(ctx.from.id));
        return ctx.reply('✅ تم حفظ الرد التلقائي.', { reply_markup: mainKeyboard() });
      }
    } catch (error) {
      console.error('Admin input error:', error);
      return ctx.reply('حصل خطأ أثناء الحفظ. راجع اتصال قاعدة البيانات وحاول مرة ثانية.');
    }
  }

  if (admin) return;

  const repliesEnabled = await getSetting('replies_enabled', 'true');
  if (repliesEnabled !== 'true') return;

  const incoming = ctx.message.text.toLocaleLowerCase('ar');
  const rows = await pool.query('SELECT keyword, response FROM auto_replies WHERE enabled = TRUE ORDER BY id ASC');
  const match = rows.rows.find((row) => incoming.includes(String(row.keyword).toLocaleLowerCase('ar')));

  if (match) {
    await ctx.reply(match.response, {
      link_preview_options: { is_disabled: false }
    });
  }
});

bot.catch((error) => {
  console.error('Telegram bot error:', error);
});

app.get('/health', (_req, res) => res.status(200).send('OK'));

async function start() {
  await initDatabase();
  await bot.init();

  await bot.api.setMyCommands([
    { command: 'start', description: 'فتح لوحة التحكم' },
    { command: 'register', description: 'تسجيل الجروب (داخل الجروب)' },
    { command: 'unregister', description: 'إلغاء تسجيل الجروب' },
    { command: 'cancel', description: 'إلغاء العملية الحالية' }
  ]);

  if (PUBLIC_URL) {
    const webhookPath = `/${WEBHOOK_SECRET}`;
    app.use(webhookPath, bot.webhookCallback('express'));
    await bot.api.setWebhook(`${PUBLIC_URL}${webhookPath}`, {
      drop_pending_updates: true
    });
    console.log(`Webhook configured for ${PUBLIC_URL}${webhookPath}`);
  } else {
    bot.start().catch((error) => console.error('Polling error:', error));
    console.log('Bot started in long-polling mode.');
  }

  app.listen(PORT, () => console.log(`Health server listening on port ${PORT}`));
  setInterval(schedulerCheck, 10000);
  await schedulerCheck();
}

start().catch((error) => {
  console.error('Startup failed:', error);
  process.exit(1);
});
                  
