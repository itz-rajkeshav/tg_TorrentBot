import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TOKEN;
const callbackDataMap = new Map(); // Added missing Map declaration

if (!token) {
  console.error('Telegram token not found in environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

async function searchMovie(movieName) {
  try {
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

    const torrents = [];
    $('table.table-list tbody tr').each((index, element) => {
      const nameColumn = $(element).find('td.coll-1.name');
      const torrentLink = $(element).find('td.coll-1.name a:nth-child(2)').attr('href');
      
      // Extract torrent ID using regex
      const torrentId = torrentLink.match(/\/torrent\/(\d+)\//)?.[1];
      
      const name = $(element).find('td.coll-1.name a:nth-child(2)').text().trim();
      const seeds = $(element).find('td.coll-2.seeds').text().trim();
      const leeches = $(element).find('td.coll-3.leeches').text().trim();
      const time = $(element).find('td.coll-date').text().trim();
      const size = $(element).find('td.coll-4.size').text().trim();

      if (torrentId) {
        torrents.push({
          torrentId, 
          name,
          torrentLink: 'https://1337x.to' + torrentLink,
          seeds,
          leeches,
          time,
          size,
        });
      }
    });

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
  { command: 'contact', description: 'Get developer contact information' },
];

bot.setMyCommands(commands).catch(console.error);
bot.onText(/\/contact/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await bot.sendChatAction(chatId, 'typing');
    const contactMessage = 
      '👨‍💻 *Developer Contact Information*\n\n' +
      '• GitHub: [itz-rajkeshav](https://github.com/itz-rajkeshav)\n' +
      '\nFeel free to reach out for any questions or suggestions!';

    await bot.sendMessage(chatId, contactMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error('Error in contact command:', error);
  }
});
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

    for (const [index, torrent] of movies.slice(0, 7).entries()) {
      const callbackId = `torrent_${index}_${Date.now()}`;
      callbackDataMap.set(callbackId, torrent);
      
      const message =
        `🎬 <b>${torrent.name}</b>\n` +
        `🌱 Seeds: ${torrent.seeds}\n` +
        `🌊 Leeches: ${torrent.leeches}\n` +
        `⏰ Time: ${torrent.time}\n` +
        `📦 Size: ${torrent.size}\n`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: '📥 Get Torrent',
              callback_data: callbackId,
            }
          ]
        ]
      };
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      });
    }
  } catch (error) {
    console.error('Error processing search:', error);
    await bot.sendMessage(
      chatId,
      '❌ Sorry, there was an error processing your request. Please try again later.'
    );
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const callbackId = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  try {
    const torrent = callbackDataMap.get(callbackId);
    if (torrent) {
      await bot.answerCallbackQuery(callbackQuery.id);
      const formattedName = torrent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const torrentUrl = `https://www.1337x.to/torrent/6297321/${formattedName}/`;
      const response = await axios.get(torrentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        }
      });

      const $ = cheerio.load(response.data);
      const magnetLink = $('a[href^="magnet:?"]').attr('href');

      await bot.sendMessage(
        chatId,
        `🎬 <b>${torrent.name}</b>\n\n` +
        `📦<b> size:${torrent.size}</b>\n\n`+
        `🔗 <code>${magnetLink}</code>`,
        { parse_mode: 'HTML' }
      );

      callbackDataMap.delete(callbackId);
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Torrent data not found. Please try searching again.' });
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    await bot.sendMessage(
      chatId,
      '❌ Sorry, there was an error retrieving the torrent information. Please try again.'
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
      'Type /help to see all available commands.\n',
    );
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

export default bot;