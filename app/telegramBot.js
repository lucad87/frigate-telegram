const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger.js');
const { telegram } = require('../config/settings.js').config;

const token = telegram.token;
const chatId = telegram.chatId;

const bot = new TelegramBot(token, { polling: true });

let notificationsEnabled = true; // New state variable

/*
    * (node:1) [node-telegram-bot-api] DeprecationWarning: 
    * In the future, content-type of files you send will default to "application/octet-stream". 
    * See https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files 
    * for more information on how sending files has been improved and on how to disable this deprecation message altogether.
*/
process.env['NTBA_FIX_350'] = 1; // Fix for the warning above

bot.on('polling_error', (error) => {
    logger.error('Polling error:', error);
    process.exit(1); // Exit the application with a non-zero status code
});

bot.onText(/\/enable_notifications/, (msg) => {
    notificationsEnabled = true;
    bot.sendMessage(msg.chat.id, 'Notifications enabled.');
    logger.info('Notifications enabled via Telegram command.');
});

bot.onText(/\/disable_notifications/, (msg) => {
    notificationsEnabled = false;
    bot.sendMessage(msg.chat.id, 'Notifications disabled.');
    logger.info('Notifications disabled via Telegram command.');
});

const sendPhoto = (eventMessage, photoBuffer, eventId) => {
    const options = {
        caption: eventMessage,
        parse_mode: 'HTML'
    };

    const fileOptions = {
        filename: `${eventId}.jpg`,
        contentType: 'image/jpeg'
    };

    try {
        bot.sendPhoto(chatId, photoBuffer, options, fileOptions);
    } catch (error) {
        logger.error('Error sending message and thumbnail to Telegram:', error);
    }
};

const getNotificationsEnabled = () => notificationsEnabled;

module.exports = { sendPhoto, getNotificationsEnabled };