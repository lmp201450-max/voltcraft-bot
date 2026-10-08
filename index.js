const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = Number(process.env.OWNER_ID);
const DB_FILE = path.join(__dirname, "data.json");

if (!TOKEN) {
  console.error("Missing BOT_TOKEN environment variable.");
  process.exit(1);
}
if (!Number.isSafeInteger(OWNER_ID) || OWNER_ID <= 0) {
  console.error("Set OWNER_ID to your numeric Telegram user ID.");
  process.exit(1);
}

const bot = new Telegraf(TOKEN);

const defaultData = {
  groups: [],
  messages: [],
  intervalMinutes: 10,
  publishing: false,
  nextMessageIndex: 0
};

function loadData() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    return { ...defaultData, ...parsed };
  } catch {
    return { ...defaultData };
  }
}
let data = loadData();

function saveData() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

const MAIN_MENU = Markup.keyboard([
  ["▶️ بدء النشر التلقائي", "⏹️ إيقاف النشر"],
  ["➕ إضافة جروب", "➖ حذف جروب"],
  ["📋 جروباتي", "✉️ إدارة الرسائل"],
  ["⏱️ دورة النشر", "📖 دليل الاستخدام"],
  ["⚙️ إعدادات البوت"]
]).resize();

const MESSAGE_MENU = Markup.keyboard([
  ["➕ إضافة رسالة", "📄 عرض الرسائل"],
  ["🗑️ حذف كل الرسائل", "⬅️ القائمة الرئيسية"]
]).resize();

const INTERVAL_MENU = Markup.keyboard([
  ["5 دقائق", "10 دقائق", "15 دقيقة"],
  ["30 دقيقة", "60 دقيقة"],
  ["⬅️ القائمة الرئيسية"]
]).resize();

const HELP_TEXT =
  "📖 *دليل الاستخدام*\\n\\n" +
  "1) أضف البوت إلى الجروب المطلوب.\\n" +
  "2) من حساب المالك، اكتب /addgroup داخل الجروب لتسجيله.\\n" +
  "3) افتح البوت في الخاص واضغط «إدارة الرسائل» ثم «إضافة رسالة».\\n" +
  "4) اكتب الرسالة التي تريد نشرها.\\n" +
  "5) اضغط «بدء النشر التلقائي».\\n\\n" +
  "⚠️ استخدم النشر فقط في الجروبات التي تسمح به، وتجنب الإزعاج أو الرسائل غير المرغوب فيها.";

function isOwner(ctx) {
  return ctx.from && ctx.from.id === OWNER_ID;
}
function isPrivate(ctx) {
  return ctx.chat && ctx.chat.type === "private";
}
function ownerOnly(ctx) {
  return isOwner(ctx) && isPrivate(ctx);
}
function mainText() {
  const status = data.publishing ? "يعمل ✅" : "متوقف ⏸️";
  return (
    "✨ *أهلًا بك في KidiCraft Bot*\\n" +
    "بوت إدارة النشر التلقائي للمجموعات.\\n\\n" +
    `📌 حالة النشر: ${status}\\n` +
    `👥 عدد الجروبات: ${data.groups.length}\\n` +
    `✉️ عدد الرسائل: ${data.messages.length}\\n` +
    `⏱️ دورة النشر: كل ${data.intervalMinutes} دقائق`
  );
}
async function showMain(ctx) {
  await ctx.reply(mainText(), { parse_mode: "Markdown", ...MAIN_MENU });
}
function resetOwnerState() {
  ownerState = null;
}
let ownerState = null;
let publishTimer = null;

async function publishOnce() {
  if (!data.publishing || data.groups.length === 0 || data.messages.length === 0) return;
  const message = data.messages[data.nextMessageIndex % data.messages.length];
  data.nextMessageIndex = (data.nextMessageIndex + 1) % data.messages.length;
  saveData();

  for (const group of [...data.groups]) {
    try {
      await bot.telegram.sendMessage(group.id, message);
    } catch (err) {
      console.error(`Failed to post to ${group.id}:`, err.description || err.message);
    }
  }
}
function restartPublishingTimer() {
  if (publishTimer) clearInterval(publishTimer);
  publishTimer = null;
  if (data.publishing) {
    publishTimer = setInterval(() => {
      publishOnce().catch(err => console.error("Publishing error:", err));
    }, data.intervalMinutes * 60 * 1000);
  }
}

bot.start(async (ctx) => {
  if (!ownerOnly(ctx)) {
    return ctx.reply("البوت خاص بمالكه فقط.");
  }
  resetOwnerState();
  await showMain(ctx);
});

bot.command("id", async (ctx) => {
  await ctx.reply(`User ID: ${ctx.from.id}\\nChat ID: ${ctx.chat.id}`);
});

bot.command("addgroup", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("الأمر ده متاح لمالك البوت فقط.");
  if (ctx.chat.type === "private") {
    return ctx.reply("افتح الجروب المطلوب واكتب /addgroup داخله.");
  }
  const id = ctx.chat.id;
  if (data.groups.some(g => g.id === id)) {
    return ctx.reply("الجروب مضاف بالفعل ✅");
  }
  data.groups.push({
    id,
    title: ctx.chat.title || String(id),
    addedAt: new Date().toISOString()
  });
  saveData();
  return ctx.reply(`تمت إضافة الجروب: ${ctx.chat.title || id} ✅`);
});

bot.command("mygroups", async (ctx) => {
  if (!ownerOnly(ctx)) return ctx.reply("البوت خاص بمالكه فقط.");
  if (!data.groups.length) return ctx.reply("لسه مفيش جروبات. أضف البوت للجروب واكتب /addgroup داخله.");
  const lines = data.groups.map((g, i) => `${i + 1}. ${g.title} — ${g.id}`);
  await ctx.reply("📋 جروباتك:\\n" + lines.join("\\n"));
});

bot.command("stop", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  data.publishing = false;
  saveData();
  restartPublishingTimer();
  await showMain(ctx);
});

bot.command("publish", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  if (!data.messages.length || !data.groups.length) {
    return ctx.reply("لازم تضيف رسالة وجروب الأول.");
  }
  await publishOnce();
  await ctx.reply("تم إرسال رسالة تجريبية للجروبات المسجلة.");
});

bot.hears("⬅️ القائمة الرئيسية", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  resetOwnerState();
  await showMain(ctx);
});

bot.hears("▶️ بدء النشر التلقائي", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  if (!data.groups.length) return ctx.reply("❗ أضف جروب أولًا: ضيف البوت للجروب واكتب /addgroup داخله.");
  if (!data.messages.length) return ctx.reply("❗ أضف رسالة أولًا من «إدارة الرسائل».");
  data.publishing = true;
  saveData();
  restartPublishingTimer();
  await ctx.reply(`تم تشغيل النشر التلقائي ✅\\nسيتم إرسال أول رسالة بعد ${data.intervalMinutes} دقائق.`, MAIN_MENU);
});

bot.hears("⏹️ إيقاف النشر", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  data.publishing = false;
  saveData();
  restartPublishingTimer();
  await ctx.reply("تم إيقاف النشر التلقائي ⏸️", MAIN_MENU);
});

bot.hears("➕ إضافة جروب", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  await ctx.reply("لإضافة جروب:\\n1) أضف البوت إلى الجروب.\\n2) من حساب المالك اكتب /addgroup داخل الجروب.\\n\\nتقدر تعرف الـ ID باستخدام /id.");
});

bot.hears("➖ حذف جروب", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  if (!data.groups.length) return ctx.reply("قائمة الجروبات فاضية.", MAIN_MENU);
  ownerState = { type: "removeGroup" };
  const rows = data.groups.map((g, i) => [`${i + 1}. ${g.title}`]);
  rows.push(["⬅️ القائمة الرئيسية"]);
  await ctx.reply("اختار رقم الجروب من القائمة التالية لحذفه:", Markup.keyboard(rows).resize());
});

bot.hears("📋 جروباتي", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  if (!data.groups.length) {
    return ctx.reply("لسه مفيش جروبات مضافة. أضف البوت لجروب واكتب /addgroup داخله.", MAIN_MENU);
  }
  const lines = data.groups.map((g, i) => `${i + 1}. ${g.title}\\n   ID: ${g.id}`);
  await ctx.reply("📋 *الجروبات المسجلة*\\n\\n" + lines.join("\\n"), { parse_mode: "Markdown", ...MAIN_MENU });
});

bot.hears("✉️ إدارة الرسائل", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  resetOwnerState();
  await ctx.reply("✉️ إدارة الرسائل\\nاختار العملية:", MESSAGE_MENU);
});

bot.hears("➕ إضافة رسالة", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  ownerState = { type: "addMessage" };
  await ctx.reply("ابعت نص الرسالة الجديدة الآن. هتتضاف لقائمة النشر.\\nللإلغاء اضغط «القائمة الرئيسية».");
});

bot.hears("📄 عرض الرسائل", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  if (!data.messages.length) return ctx.reply("مفيش رسائل محفوظة.", MESSAGE_MENU);
  const lines = data.messages.map((m, i) => `${i + 1}. ${m}`);
  await ctx.reply("📄 *الرسائل المحفوظة*\\n\\n" + lines.join("\\n\\n"), { parse_mode: "Markdown", ...MESSAGE_MENU });
});

bot.hears("🗑️ حذف كل الرسائل", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  data.messages = [];
  data.nextMessageIndex = 0;
  saveData();
  await ctx.reply("تم حذف كل الرسائل.", MESSAGE_MENU);
});

bot.hears("⏱️ دورة النشر", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  await ctx.reply(`الدورة الحالية: كل ${data.intervalMinutes} دقائق. اختار دورة جديدة:`, INTERVAL_MENU);
});

bot.hears(/^(5 دقائق|10 دقائق|15 دقيقة|30 دقيقة|60 دقيقة)$/, async (ctx) => {
  if (!ownerOnly(ctx)) return;
  const mins = Number(ctx.match[0].match(/\d+/)[0]);
  data.intervalMinutes = mins;
  saveData();
  restartPublishingTimer();
  await ctx.reply(`تم ضبط دورة النشر على كل ${mins} دقائق.`, MAIN_MENU);
});

bot.hears("📖 دليل الاستخدام", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  await ctx.reply(HELP_TEXT, { parse_mode: "Markdown", ...MAIN_MENU });
});

bot.hears("⚙️ إعدادات البوت", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  await ctx.reply(
    `⚙️ إعدادات البوت\\n\\nحالة النشر: ${data.publishing ? "يعمل ✅" : "متوقف ⏸️"}\\n` +
    `دورة النشر: ${data.intervalMinutes} دقائق\\n` +
    `الجروبات: ${data.groups.length}\\nالرسائل: ${data.messages.length}\\n\\n` +
    "الأمر /publish يرسل رسالة تجريبية فورًا.",
    MAIN_MENU
  );
});

bot.on("text", async (ctx) => {
  if (!ownerOnly(ctx)) return;
  const text = ctx.message.text;

  if (ownerState?.type === "addMessage") {
    if (text.startsWith("/")) return;
    data.messages.push(text);
    saveData();
    ownerState = null;
    return ctx.reply("تم حفظ الرسالة بنجاح ✅", MESSAGE_MENU);
  }

  if (ownerState?.type === "removeGroup") {
    const match = text.match(/^(\d+)\.\s/);
    if (!match) return ctx.reply("اختار جروب من الأزرار أو اضغط القائمة الرئيسية.");
    const index = Number(match[1]) - 1;
    if (index < 0 || index >= data.groups.length) {
      return ctx.reply("الرقم غير صحيح. اختار جروب من القائمة.");
    }
    const [removed] = data.groups.splice(index, 1);
    saveData();
    ownerState = null;
    return ctx.reply(`تم حذف الجروب: ${removed.title} 🗑️`, MAIN_MENU);
  }

  await ctx.reply("اختار من أزرار القائمة، أو اكتب /start.", MAIN_MENU);
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.launch()
  .then(() => {
    console.log("KidiCraft Bot is running.");
    restartPublishingTimer();
  })
  .catch((err) => {
    console.error("Could not start bot:", err);
    process.exit(1);
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
