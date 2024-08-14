const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config.js');
const logger = require('./logger.js');


const token = config.token;
const chatId = config.chatId;

const bot = new TelegramBot(token, { polling: true });

/*
    * (node:1) [node-telegram-bot-api] DeprecationWarning: 
    * In the future, content-type of files you send will default to "application/octet-stream". 
    * See https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files 
    * for more information on how sending files has been improved and on how to disable this deprecation message altogether.
*/
process.env["NTBA_FIX_350"] = 1; // Fix for the warning above

// Send the event to Telegram
const sendMessage = (eventMessage) => {
    bot.sendMessage(chatId, eventMessage)
        .then(() => {
            logger.info('Message sent to Telegram');
        })
        .catch((error) => {
            logger.error('Error sending message to Telegram:', error);
        });
}

// Send the event message and thumbnail to Telegram
const sendPhoto = (caption, photoBuffer, eventId) => {
    const options = {
        caption
    };

    const fileOptions = {
        filename: `${eventId}.jpg`,
        contentType: 'image/jpeg'
    };

    try {
        // bot.sendPhoto(chatId, photoBuffer, { caption }, { filename: `${eventId}.jpg`, contentType: 'image/jpeg' });
        bot.sendPhoto(chatId, photoBuffer, options, fileOptions);
    } catch (error) {
        logger.error('Error sending message and thumbnail to Telegram:', error);
    }
};

module.exports = { sendPhoto, sendMessage };