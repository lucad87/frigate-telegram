const util = require('util');
const { dateTime } = require('../config/settings.js').config;

// The container has no LANG set, so a bare toLocaleString() falls back to the
// en-US format and the configured LOCALES/TIMEZONE are ignored. Pass them
// explicitly, as logger.js already does for the log timestamps.
const epochToDateTime = (epoch) => {
    return new Date(epoch * 1000).toLocaleString(dateTime.locales, {
        timeZone: dateTime.timezone
    });
};

const getEpochTimestampFromSecondsAgo = (seconds) => {
    const actual_dateTime = Date.now();
    return Math.floor((actual_dateTime - (seconds * 1000)) / 1000);
};

const formatEventMessage = (event, frigateUiUrl) => {
    // The link opens the event in the Frigate UI instead of pointing at the clip
    // file: /api/events/<id>/clip.mp4 requires authentication and a link cannot
    // carry credentials, so it answers 401 to whoever clicks it.
    // Frigate's own recording share link is /review?timestamp=<camera>_<seconds>.
    const reviewUrl = `${frigateUiUrl}/review?timestamp=${encodeURIComponent(`${event.camera}_${Math.floor(event.start_time)}`)}`;

    return util.format('%s\n%s\n%s\n%s\n%s',
        '⚠️⚠️ <b>EVENT DETECTED</b> ⚠️⚠️', 
        `<pre>${event.id}</pre>`, 
        `🎥 <a href="${reviewUrl}">VIDEO LINK</a> 🎥`, 
        `<pre><i>${epochToDateTime(event.start_time)}</i></pre>`,
        `<pre><i>${epochToDateTime(event.end_time)}</i></pre>`
    );
};

module.exports = { epochToDateTime, getEpochTimestampFromSecondsAgo, formatEventMessage };
