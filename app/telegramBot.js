const { TelegramBot } = require('node-telegram-bot-api');
const logger = require('./logger.js');
const { COMMANDS, parseCommand, helpMessage } = require('./commands.js');
const { telegram } = require('../config/settings.js').config;

const token = telegram.token;
const chatId = telegram.chatId;

const bot = new TelegramBot(token, { polling: true });

let notificationsEnabled = true; // New state variable

bot.setMyCommands(COMMANDS).catch((error) => {
    // An unhandled rejection would terminate the process
    logger.error('Error setting the bot commands:', error);
});

const reply = (targetChatId, message) => {
    bot.sendMessage(targetChatId, message).catch((error) => {
        logger.error('Error sending message to Telegram:', error);
    });
};

bot.on('message', (msg) => {
    const command = parseCommand(msg.text);

    if (!command) {
        return;
    }

    switch (command) {
        case 'help':
            reply(msg.chat.id, helpMessage());
            break;
        case 'enable_notifications':
            notificationsEnabled = true;
            logger.info('Notifications enabled via Telegram command.');
            reply(msg.chat.id, 'Notifiche attivate.');
            break;
        case 'disable_notifications':
            notificationsEnabled = false;
            logger.info('Notifications disabled via Telegram command.');
            reply(msg.chat.id, 'Notifiche disattivate.');
            break;
    }
});

bot.on('polling_error', (error) => {
    logger.error('Polling error:', error);
    process.exit(1); // Exit the application with a non-zero status code
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

    // These calls return a promise: without a catch the rejection would be
    // unhandled and terminate the process
    bot.sendPhoto(chatId, photoBuffer, options, fileOptions).catch((error) => {
        logger.error('Error sending message and thumbnail to Telegram:', error);
    });
};

const sendAnimation = (eventMessage, animationBuffer, eventId) => {
    const options = {
        caption: eventMessage,
        parse_mode: 'HTML'
    };

    const fileOptions = {
        filename: `${eventId}.gif`,
        contentType: 'image/gif'
    };

    bot.sendAnimation(chatId, animationBuffer, options, fileOptions).catch((error) => {
        logger.error('Error sending message and animation to Telegram:', error);
    });
};

const sendPhotoAndAnimation = async (eventMessage, thumbnailBuffer, animationBuffer, eventId) => {
    try {
        // Send the thumbnail first with the event message
        const photoOptions = {
            caption: eventMessage,
            parse_mode: 'HTML'
        };

        const photoFileOptions = {
            filename: `${eventId}.jpg`,
            contentType: 'image/jpeg'
        };

        await bot.sendPhoto(chatId, thumbnailBuffer, photoOptions, photoFileOptions);

        // Then send the animation GIF separately (without caption to avoid duplication)
        const animationFileOptions = {
            filename: `${eventId}.gif`,
            contentType: 'image/gif'
        };

        await bot.sendAnimation(chatId, animationBuffer, {}, animationFileOptions);
    } catch (error) {
        logger.error('Error sending photo and animation to Telegram:', error);
    }
};

const sendMessage = (eventMessage, eventId) => {
    const options = {
        parse_mode: 'HTML'
    };

    bot.sendMessage(chatId, eventMessage, options).catch((error) => {
        logger.error('Error sending message to Telegram:', error);
    });
};

const getNotificationsEnabled = () => notificationsEnabled;

module.exports = { sendPhoto, sendAnimation, sendPhotoAndAnimation, sendMessage, getNotificationsEnabled };
