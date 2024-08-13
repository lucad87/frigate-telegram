const frigateApi = require('./fetchEvents.js');
const telegram = require('./telegramBot.js');
const epochToDateTime = require('./utils.js');
const logger = require('./logger.js');
const util = require('util');

const processEvent = async (eventId) => {
    try {
        const event = await frigateApi.fetchEvent(eventId);

        if (event === null) {
            throw new Error('Fetched event is null');
        }

        logger.info(`Received event: ${JSON.stringify(event)}`);

        // Format the event object into a readable string
        const eventMessage = util.format('%s\nCamera: %s\n%s\n%s\n%s', 
            event.id, 
            event.camera,
            `https://frigate.lucad.cloud/api/events/${event.id}/thumbnail.jpg`, 
            epochToDateTime(event.start_time), 
            epochToDateTime(event.end_time));

        // TODO: get the file directly from frigate docker volume and send it to telegram
        // ...
        
        // Decode the base64 thumbnail
        const thumbnailBuffer = Buffer.from(event.thumbnail, 'base64');

        // Send the event message and thumbnail to Telegram
        telegram.sendPhoto(eventMessage, thumbnailBuffer, event.id);
    } catch (error) {
        logger.error(`Error processing event: ${error.message}`);
    }
};

const processEvents = async () => {
    try {
        const events = await frigateApi.fetchEvents();

        if (events === null) {
            throw new Error('Fetched events is null');
        }

        events.forEach(event => {
            logger.log(`Received event: ${JSON.stringify(event)}`);

            // Format the event object into a readable string
            const eventMessage = `${event.id}\nCamera: ${event.camera}\n${epochToDateTime(event.start_time)}\n${epochToDateTime(event.end_time)}`;

            // Send the event to Telegram
            telegram.sendMessage(eventMessage);
        });
        logger.info('All messages sent to Telegram');
    } catch (error) {
        logger.error(`Error sending message to Telegram: ${error.message}`);
    }
};

module.exports = { processEvent, processEvents };