const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = ["788157490", "402486461"]; // Add multiple admin IDs
// "788157490"

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing in .env file!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const welcomeMessage = `

🤖 *I’m KAI*, your personal travel AI, built to automate and personalize every step of your journey.

I navigate across portals to find the best deals, craft seamless itineraries, and even auto-book your trips.

📌 *My mission?* To break down the fragmented, complex world of travel and put travelers first.

💼 *Backed by:* Hustle Fund, Polygon Ventures, NewTribe Capital, and more.

⚡ *Accept KAI or get left behind.*

Curious to see Kai in action? Tap below! 👇

CA:[6DpdEMbQ5a2CowagL9qZpA7pP367b9Fv1k2x7FcJvirt](https://app.virtuals.io/virtuals/21083)

TICKER:$AITRAVEL

`;

// File for storing user database
const USER_DB_FILE = "userDb.json";

// Load user database from JSON file
let userDb = loadUserDb();

// Function to load user database from JSON file
function loadUserDb() {
  try {
    if (fs.existsSync(USER_DB_FILE)) {
      const data = fs.readFileSync(USER_DB_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading user database:", error);
  }
  return {}; // Return empty object if file doesn't exist or has an error
}

// Function to save user database to JSON file
function saveUserDb() {
  try {
    fs.writeFileSync(USER_DB_FILE, JSON.stringify(userDb, null, 2));
  } catch (error) {
    console.error("Error saving user database:", error);
  }
}

// Store user states
let userStates = {};

// Middleware to track users and update database
bot.use((msg, next) => {
  const userId = String(msg.from.id);

  // If user is not in the database, add them
  if (!userDb[userId]) {
    userDb[userId] = msg.from.username || `User_${userId}`;
    saveUserDb(); // Save the updated database
  }

  next();
});

bot.command("start", (msg) => {
  const userId = String(msg.from.id);
  let message = welcomeMessage;
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "📝 About KAI",
          url: "https://x.com/BukProtocol/status/1889662395465003402",
        },
      ],
      [
        {
          text: "🌍 BukProtocol Website",
          url: "https://bukprotocol.ai/",
        },
        { text: "🌍 Kai Website ", url: "https://bukprotocol.ai/kai" },
      ],
      [
        { text: "👥 Join the Community", url: "https://t.me/bukprotocol" },
        {
          text: "📼 Demo Video",
          url: "https://x.com/BukProtocol/status/1888884933583663118",
        },
      ],
      [
        {
          text: "$AITRAVEL",
          url: "https://www.geckoterminal.com/solana/pools/GxGjduAwVncnaAJCuWC9H7deHEya7XsKDGP94u6XdLV2",
        },
      ],
    ],
  };

  // Show admin options only if the user is an admin
  if (ADMIN_IDS.includes(userId)) {
    keyboard.inline_keyboard.push([
      { text: "📢 Broadcast Message", callback_data: "broadcast" },
    ]);
  }

  bot.telegram.sendPhoto(
    msg.chat.id,
    { source: "./kai.jpg" },
    {
      caption: message,
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
});

// Command: Broadcast (Admin Only)
bot.on("callback_query", async (ctx) => {
  const userId = String(ctx.from.id);
  const callbackData = ctx.callbackQuery.data;

  if (callbackData === "broadcast" && ADMIN_IDS.includes(userId)) {
    userStates[userId] = "broadcast";
    await ctx.reply("📢 Please type the message you want to broadcast.");
  } else {
    await ctx.answerCbQuery();
  }
});
// Handle text messages for broadcasting
bot.on("text", async (ctx) => {
  const userId = String(ctx.from.id);

  if (userStates[userId] === "broadcast" && ADMIN_IDS.includes(userId)) {
    const messageText = ctx.message.text;

    // Check if the message contains a photo (text + image case)
    if (ctx.message.photo) {
      await handleBroadcastWithImage(ctx, messageText, ctx.message.photo);
    } else {
      await handleBroadcast(ctx, messageText);
    }

    userStates[userId] = null; // Reset state
  }
});

// Handle photo messages (photo only or photo + text)
bot.on("photo", async (ctx) => {
  const userId = String(ctx.from.id);

  if (userStates[userId] === "broadcast" && ADMIN_IDS.includes(userId)) {
    const messageText = ctx.message.caption; // Check if there is a caption
    const messagePhoto = ctx.message.photo;

    if (messageText) {
      await handleBroadcastWithImage(ctx, messageText, messagePhoto);
    } else {
      await handleBroadcastWithPhotoOnly(ctx, messagePhoto);
    }

    userStates[userId] = null; // Reset state
  }
});

// Handle video messages (video only or video + text)
bot.on("video", async (ctx) => {
  const userId = String(ctx.from.id);

  console.log("video sent");

  if (userStates[userId] === "broadcast" && ADMIN_IDS.includes(userId)) {
    const messageText = ctx.message.caption; // Check if there is a caption
    const messageVideo = ctx.message.video;

    if (messageText) {
      await handleBroadcastWithVideo(ctx, messageText, messageVideo);
    } else {
      await handleBroadcastWithVideoOnly(ctx, messageVideo);
    }

    userStates[userId] = null; // Reset state
  }
});

function escapeMarkdownV2(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
}

// Function to broadcast a text message to all users
async function handleBroadcast(ctx, message) {
  let successCount = 0;
  let failCount = 0;

  // Escape message for MarkdownV2
  const escapedMessage = escapeMarkdownV2(message);

  for (const userId in userDb) {
    try {
      await bot.telegram.sendMessage(userId, escapedMessage, {
        parse_mode: "MarkdownV2",
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to send message to ${userId}:`, error.message);
      failCount++;
    }
  }

  // Send broadcast summary to all admins
  await sendBroadcastSummaryToAdmins(successCount, failCount);
}

// Function to handle broadcast with text + image
async function handleBroadcastWithImage(ctx, message, photo) {
  let successCount = 0;
  let failCount = 0;

  for (const userId in userDb) {
    const escapedMessage = escapeMarkdownV2(message);

    try {
      await bot.telegram.sendPhoto(userId, photo[photo.length - 1].file_id, {
        caption: escapedMessage, // Send text as caption for the image
        parse_mode: "MarkdownV2",
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to send message to ${userId}:`, error.message);
      failCount++;
    }
  }

  // Send broadcast summary to all admins
  await sendBroadcastSummaryToAdmins(successCount, failCount);
}

// Function to handle broadcast with only a photo (no text)
async function handleBroadcastWithPhotoOnly(ctx, photo) {
  let successCount = 0;
  let failCount = 0;

  for (const userId in userDb) {
    try {
      await bot.telegram.sendPhoto(userId, photo[photo.length - 1].file_id); // Send image without text
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to send image to ${userId}:`, error.message);
      failCount++;
    }
  }

  // Send broadcast summary to all admins
  await sendBroadcastSummaryToAdmins(successCount, failCount);
}

// Function to handle broadcast with text + video
async function handleBroadcastWithVideo(ctx, message, video) {
  let successCount = 0;
  let failCount = 0;

  for (const userId in userDb) {
    const escapedMessage = escapeMarkdownV2(message);

    try {
      await bot.telegram.sendVideo(userId, video.file_id, {
        caption: escapedMessage, // Send text as caption for the video
        parse_mode: "MarkdownV2",
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to send message to ${userId}:`, error.message);
      failCount++;
    }
  }

  // Send broadcast summary to all admins
  await sendBroadcastSummaryToAdmins(successCount, failCount);
}

// Function to handle broadcast with only a video (no text)
async function handleBroadcastWithVideoOnly(ctx, video) {
  let successCount = 0;
  let failCount = 0;

  for (const userId in userDb) {
    try {
      await bot.telegram.sendVideo(userId, video.file_id); // Send video without text
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to send video to ${userId}:`, error.message);
      failCount++;
    }
  }

  // Send broadcast summary to all admins
  await sendBroadcastSummaryToAdmins(successCount, failCount);
}

// Function to send summary to all admins

// Function to send summary to all admins
async function sendBroadcastSummaryToAdmins(successCount, failCount) {
  const summaryMessage = `📢 Broadcast Summary:\n✅ Sent: ${successCount}\n❌ Failed: ${failCount}\n👥 Total: ${
    Object.keys(userDb).length - ADMIN_IDS.length
  }`;

  for (const adminId of ADMIN_IDS) {
    try {
      await bot.telegram.sendMessage(adminId, summaryMessage);
    } catch (error) {
      console.error(
        `❌ Failed to send summary to admin ${adminId}:`,
        error.message
      );
    }
  }
}

// Start bot
console.log("🚀 KAI Bot is running...");

bot.launch();
