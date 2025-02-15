const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing in .env file!");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const welcomeMessage = `🤖 *I’m KAI*, your personal travel AI, built to automate and personalize every step of your journey.

I navigate across portals to find the best deals, craft seamless itineraries, and even auto-book your trips.

📌 *My mission?* To break down the fragmented, complex world of travel and put travelers first.

💼 *Backed by:* Hustle Fund, Polygon Ventures, NewTribe Capital, and more.

⚡ *Accept KAI or get left behind.*

`;

const keyboard = {
  inline_keyboard: [
    [
      {
        text: "📝 About KAI",
        url: "https://x.com/BukProtocol/status/1889662395465003402",
      },
    ],
    [{ text: "🌍 BukProtocol Website", url: "https://bukprotocol.ai/" }],
    [{ text: "🌍 KAI Website", url: "https://kai.bukprotocol.ai/" }],
    [
      {
        text: "📼 Demo Video",
        url: "https://x.com/BukProtocol/status/1888884933583663118",
      },
    ],
    [{ text: "👥 Join the Community", url: "https://t.me/bukprotocol" }],
    [{ text: "📢 CA: COMING SOON", callback_data: "ca_coming_soon" }],
    [{ text: "💰 TICKER: COMING SOON", callback_data: "ticker_coming_soon" }],
  ],
};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, welcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
});

console.log("🚀 KAI Bot is running...");
