# Telegram Movie Search Bot

This is a Telegram bot that allows users to search for movies and retrieve torrent links using the 1337x website. The bot fetches search results and provides torrent details, including seeds, leeches, size, and download links.

## Features

- Search for movies using the `/search` command.
- Retrieve torrent details such as seeds, leeches, and size.
- Get magnet links for downloading torrents.
- Interactive inline buttons for ease of use.
- Commands for help and developer contact.

## Installation

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-folder>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your Telegram bot token:
   ```env
   TOKEN=your_telegram_bot_token
   ```

## Usage

1. Start the bot by running:
   ```bash
   npm start
   ```
2. Open Telegram and search for your bot.
3. Use the following commands:
   - `/start` - Start the bot and get a welcome message.
   - `/search <movie name>` - Search for a movie.
   - `/help` - Get a list of available commands.

## Commands

- `/start` - Starts the bot and provides a welcome message.
- `/search <movie name>` - Searches for torrents of the provided movie.
- `/help` - Lists all available commands.

## Deployment

To deploy your bot, you can use services like:

- [Vercel](https://vercel.com)
- [Railway](https://railway.app)
- [Heroku](https://www.heroku.com)

Ensure that your environment variables are properly set on the deployment platform.

## Troubleshooting

- Ensure your Telegram bot token is correct in the `.env` file.
- If no torrents are found, try searching with different keywords.
- If you encounter Cloudflare protection issues, try using a proxy service.

