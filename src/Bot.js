import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TOKEN;

if (!token) {
  console.error('Telegram token not found in environment variables');
  process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(token, { polling: true });

// Helper function to search for movies
async function searchMovie(movieName) {
  try {
    const formattedName = movieName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
      console.log(formattedName);
      // console.log(year);
      
      
    const movieUrl = `https://en.yts-official.mx/movies/${formattedName}/`;
    
    const response = await axios.get(movieUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    const title = $('div.movie-info h1').text().trim();
    const quality = $('div.quality-size').first().text().trim();
    const magnetLinks = [];

    $('a.magnet-download').each((i, element) => {
      const magnetLink = $(element).attr('href');
      if (magnetLink) magnetLinks.push(magnetLink);
    });

    if (magnetLinks.length === 0) {
      console.error('No magnet links found');
      return null;
    }
    return {
      title,
      quality,
      magnetLinks,
    };
  } catch (error) {
    console.error('Error searching for movie:', error.message);
    return null;
  }
}

const commands = [
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show available commands' },
  { command: 'search', description: 'Search for a movie. Usage: /search <movie name> <year>' },
];

bot.setMyCommands(commands).catch(console.error);

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.first_name || 'there';
  
  try {
    await bot.sendChatAction(chatId, 'typing');
    await bot.sendMessage(
      chatId,
      `👋 Hello ${username}!\n\n` +
      `I can help you search for movies. Use the /search command followed by a movie name.\n\n` +
      `Example: /search Inception\n\n` +
      `Type /help to see all available commands.`
    );
  } catch (error) {
    console.error('Error in start command:', error);
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    await bot.sendChatAction(chatId, 'typing');
    const helpText = commands
      .map(cmd => `/${cmd.command} - ${cmd.description}`)
      .join('\n');
    
    await bot.sendMessage(chatId, `Available commands:\n\n${helpText}`);
  } catch (error) {
    console.error('Error in help command:', error);
  }
});

bot.onText(/\/search(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const movieName = match?.[1]?.trim();
  
  try {
    if (!movieName) {
      await bot.sendMessage(
        chatId,
        '⚠️ Please provide a movie name.\nExample: /search Inception'
      );
      return;
    }

    await bot.sendChatAction(chatId, 'typing');
    await bot.sendMessage(chatId, `🔍 Searching for: "${movieName}"`);

    const movieData = await searchMovie(movieName);

    if (!movieData || movieData.magnetLinks.length === 0) {
      await bot.sendMessage(
        chatId,
        '❌ Sorry, could not find that movie or magnet links. Please try another search.'
      );
      return;
    }

    const message = 
      `🎬 Found: ${movieName} \n` +
      `📺 Quality: 1080p\n` +
      `🔗 Download Link:   ${movieData.magnetLinks[0]}`;

    await bot.sendMessage(chatId, message);

  } catch (error) {
    console.error('Error processing search:', error);
    await bot.sendMessage(
      chatId,
      '❌ Sorry, there was an error processing your request. Please try again later.'
    );
  }
});


bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  
  // Ignore commands
  if (msg.text?.startsWith('/')) {
    return;
  }
  
  try {
    await bot.sendChatAction(chatId, 'typing');
    await bot.sendMessage(
      chatId,
      '❓ To search for a movie, use the /search command followed by the movie name.\n' +
      'Example: /search Inception\n\n' +
      'Type /help to see all available commands.'
    );
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

export default bot;
