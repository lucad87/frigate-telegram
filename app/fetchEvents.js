const axios = require('axios');
const config = require('../config/config.js');
const logger = require('./logger.js');


const frigateApiUrl = config.frigateUrl;

logger.info(`Frigate API URL: ${frigateApiUrl}`);

const fetchEvent = async (eventId) => {
    // example of eventId: 1723532135.282072-4fccyg
    try {
        const response = await axios.get(`${frigateApiUrl}/api/events/${eventId}`);

        if (response && response !== '') {
            logger.info(`Fetched the event ${eventId} from Frigate`);
        }

        return response.data; // No need to parse response.data
    } catch (error) {
        logger.error('Error fetching the event from Frigate:', error);
        throw new Error('Error fetching the event from Frigate:', error);
    }
};

const fetchEvents = async () => {
    try {
        const actual_dateTime = Date.now();
        const after_value = Math.floor((actual_dateTime - 60000) / 1000) // 60 seconds ago

        const response = await axios.get(`${frigateApiUrl}/api/events?camera=terrazza&zones=danger&label=person&after=${after_value}`);

        if (response && response !== '') {
            logger.info(`Fetched an event from Frigate`);
        }

        return response.data;
    } catch (error) {
        logger.error('Error fetching events from Frigate:', error);
        throw new Error('Error fetching events from Frigate:', error);
    }
};

module.exports = { fetchEvents, fetchEvent };