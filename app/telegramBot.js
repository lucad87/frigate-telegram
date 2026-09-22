const { TelegramBot } = require('node-telegram-bot-api');
const logger = require('./logger.js');
const {
    COMMANDS,
    parseCommand,
    helpMessage,
    parseEventsLimit,
    formatStatus,
    formatEventList
} = require('./commands.js');
const { getVersion, getStats, getRecentEvents } = require('./frigateApi.js');
const { telegram, frigate } = require('../config/settings.js').config;

const token = telegram.token;
const chatId = telegram.chatId;

const bot = new TelegramBot(token, { polling: true });

let notificationsEnabled = true; // New state variable
let botUsername = null; // filled in below, used to strip the @mention exactly

bot.getMe()
    .then((me) => {
        botUsername = me.username;
    })
    .catch((error) => {
        logger.error('Error reading the bot username:', error);
    });

bot.setMyCommands(COMMANDS).catch((error) => {
    // An unhandled rejection would terminate the process
    logger.error('Error setting the bot commands:', error);
});

const reply = (targetChatId, message) => {
    bot.sendMessage(targetChatId, message).catch((error) => {
        logger.error('Error sending message to Telegram:', error);
    });
};

const commands = {
    help: (msg) => reply(msg.chat.id, helpMessage()),

    status: async (msg) => {
        const [stats, version] = await Promise.all([getStats(), getVersion()]);

        reply(msg.chat.id, formatStatus(stats, version, notificationsEnabled));
    },

    events: async (msg, args) => {
        const limit = parseEventsLimit(args);
        const events = await getRecentEvents(limit);

        reply(msg.chat.id, formatEventList(events, frigate.uiUrl, limit, {
            showLimitHint: args.length === 0
        }));
    },

    enable_notifications: (msg) => {
        notificationsEnabled = true;
        logger.info('Notifications enabled via Telegram command.');
        reply(msg.chat.id, 'Notifiche attivate.');
    },

    disable_notifications: (msg) => {
        notificationsEnabled = false;
        logger.info('Notifications disabled via Telegram command.');
        reply(msg.chat.id, 'Notifiche disattivate.');
    }
};

bot.on('message', async (msg) => {
    const parsed = parseCommand(msg.text, botUsername);

    if (!parsed) {
        // command-like texts are worth leaving a trace of, they are the only
        // ones the parser can silently ignore
        if (typeof msg.text === 'string' && msg.text.trim().startsWith('/')) {
            logger.info(`Unrecognised command text: ${JSON.stringify(msg.text.slice(0, 80))}`);
        }

        return;
    }

    try {
        logger.info(`Command /${parsed.command} args=[${parsed.args.join(' ')}]`);
        await commands[parsed.command](msg, parsed.args);
    } catch (error) {
        logger.error(`Error handling /${parsed.command}:`, error);
        reply(msg.chat.id, `Errore: non riesco a leggere i dati da Frigate (${error.message})`);
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
