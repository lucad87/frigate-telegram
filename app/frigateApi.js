/*
    Thin wrappers around the Frigate HTTP API used by the Telegram commands.
    Errors are left to the caller, so a command can tell the user that Frigate
    could not be reached instead of failing silently.
*/
const axios = require('axios').default;
const { withFrigateAuth } = require('./frigateAuth.js');
const { frigate } = require('../config/settings.js').config;

const getVersion = async () => {
    const response = await withFrigateAuth((config) => axios.get(`${frigate.url}/api/version`, config));

    return response.data;
};

const getStats = async () => {
    const response = await withFrigateAuth((config) => axios.get(`${frigate.url}/api/stats`, config));

    return response.data;
};

const getRecentEvents = async (limit) => {
    const response = await withFrigateAuth((config) => axios.get(`${frigate.url}/api/events`, {
        ...config,
        // thumbnails would make the payload much larger and are not used here
        params: { limit: limit, include_thumbnails: 0 }
    }));

    return response.data;
};

module.exports = { getVersion, getStats, getRecentEvents };
