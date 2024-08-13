const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config.js');
const logger = require('./logger.js');


const token = config.token;
const chatId = config.chatId;

const bot = new TelegramBot(token, { polling: true });

// Send the event to Telegram
const sendMessage = (eventMessage) => {
    bot.sendMessage(chatId, eventMessage)
        .then(() => {
            logger.log('Message sent to Telegram');
        })
        .catch((error) => {
            logger.error('Error sending message to Telegram:', error);
        });
}
    
const sendPhoto = (caption, photoBuffer, eventId) => {
    try {
        bot.sendPhoto(chatId, photoBuffer, { caption }, { filename: `${eventId}.jpg`, contentType: 'application/octet-stream'});
    } catch (error) {
        logger.error('Error sending message and thumbnail to Telegram:', error);
    }
};

module.exports = { sendPhoto, sendMessage };