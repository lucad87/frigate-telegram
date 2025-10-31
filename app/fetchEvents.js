const axios = require('axios').default;
const logger = require('./logger.js');
const { getEpochTimestampFromSecondsAgo } = require('./utils.js');
const { frigate, polling } = require('../config/settings.js').config;

const fetchEvents = async () => {
    try {
        const url = `${frigate.url}/api/events`;

        const axiosConfig = {
            params: {
                camera: frigate.camera,
                zones: frigate.zones,
                label: frigate.label,
                after: getEpochTimestampFromSecondsAgo(polling.interval)
            }
        };

        // Add authentication if credentials are provided
        if (frigate.username && frigate.password) {
            axiosConfig.auth = {
                username: frigate.username,
                password: frigate.password
            };
        }

        const response = await axios.get(url, axiosConfig);

        return response.data;
    } catch (error) {
        logger.warn('Cannot fetch events from Frigate', error);
    }
};

module.exports = { fetchEvents };