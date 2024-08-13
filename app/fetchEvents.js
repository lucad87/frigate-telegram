const axios = require('axios');
const config = require('../config/config.js');
const logger = require('./logger.js');


const frigateApiUrl = config.frigateUrl;

logger.info(`Frigate API URL: ${frigateApiUrl}`);

const fetchEvent = async (eventId) => {
    // example of eventId: 1723532135.282072-4fccyg
    try {
        const response = await axios.get(`${frigateApiUrl}/api/events/${eventId}`);

        logger.info(`Fetched the event ${eventId} from Frigate:`, response.data);

        return response.data; // No need to parse response.data
    } catch (error) {
        logger.error('Error fetching the event from Frigate:', error);
        return null;
    }
};

const fetchEvents = async () => {
    try {
        const response = await get(`${frigateApiUrl}/api/events`);
        return JSON.parse(response.data);
    } catch (error) {
        logger.error('Error fetching events from Frigate:', error);
        return null;
    }
};

module.exports = { fetchEvents, fetchEvent };

module.exports = { fetchEvents, fetchEvent };