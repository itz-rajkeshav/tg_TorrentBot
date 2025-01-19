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

const bot = new TelegramBot(token, { polling: true });

async function searchMovie(movieName) {
  try {
      // Format the movie name for the URL
      const formattedName = movieName.replace(/\s+/g, '+');
      console.log('Searching for:', formattedName);

      const config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `https://www.1337x.to/search/${formattedName}/1/`,
          headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          }
      };

      const response = await axios.request(config);

      const $ = cheerio.load(response.data);

      const pageTitle = $('title').text();
      // console.log('Page Title:', pageTitle);

      const searchFormAction = $('#search-form').attr('action');
      // console.log('Search Form Action URL:', searchFormAction);
      const torrents = [];
      $('table.table-list tbody tr').each((index, element) => {
          const name = $(element).find('td.coll-1.name a').text().trim();
          const seeds = $(element).find('td.coll-2.seeds').text().trim();
          const leeches = $(element).find('td.coll-3.leeches').text().trim();
          const time = $(element).find('td.coll-date').text().trim();
          const size = $(element).find('td.coll-4.size').text().trim();
          torrents.push({ name, seeds, leeches, time, size });
      });

      // console.log('Torrents:', torrents);

      return torrents;

  } catch (error) {
      console.error('Error details:', {
          message: error.message,
          response: error.response?.status,
          data: error.response?.data,
      });
      throw new Error('Failed to fetch movie data');
  }
}

const commands = [
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show available commands' },
  { command: 'search', description: 'Search for a movie. Usage: /search <movie name>' },
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
      .map((cmd) => `/${cmd.command} - ${cmd.description}`)
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

    const movies = await searchMovie(movieName);

    if (!movies || movies.length === 0) {
      await bot.sendMessage(
        chatId,
        '❌ Sorry, no results found for your query. Please try another search.'
      );
      return;
    }

    // Use for...of instead of forEach for async operations
    for (const torrent of movies.slice(0, 7)) {
      const message =
        `🎬 <b>${torrent.name}</b>\n` +
        `🌱 Seeds: ${torrent.seeds}\n` +
        `🌊 Leeches: ${torrent.leeches}\n` +
        `⏰ Time: ${torrent.time}\n` +
        `📦 Size: ${torrent.size}\n` +
        // `👤 Uploader: ${torrent.uploader}\n\n` +
        // `🔗 <a href="${torrent.torrentLink}">Get Torrent</a>`;
        // let inlineKeyboard = {
        //   inline_keyboard: [
        //     [
        //       {
        //         text: 'Get Torrent',
        //         callback_data: JSON.stringify({
        //           action: 'get_torrent',
        //           torrentLink: torrent.torrentLink, // Assuming this is available
        //         }),
        //       },
        //     ],
        //   ],
        // };

      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }
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