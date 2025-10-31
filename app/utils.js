const util = require('util');

const epochToDateTime = (epoch) => {
    return new Date(epoch * 1000).toLocaleString();
};

const getEpochTimestampFromSecondsAgo = (seconds) => {
    const actual_dateTime = Date.now();
    return Math.floor((actual_dateTime - (seconds * 1000)) / 1000);
};

const formatEventMessage = (event, frigateMediaUrl) => {
    // For the Telegram message, use the media URL without credentials
    // Telegram may block links with credentials in them
    // Add padding=30 parameter to include 30 seconds before and after the event
    const clipUrl = `${frigateMediaUrl}/api/events/${event.id}/clip.mp4?padding=30`;

    return util.format('%s\n%s\n%s\n%s\n%s',
        '⚠️⚠️ <b>EVENT DETECTED</b> ⚠️⚠️', 
        `<pre>${event.id}</pre>`, 
        `🎥 <a href="${clipUrl}">VIDEO LINK</a> 🎥`, 
        `<pre><i>${epochToDateTime(event.start_time)}</i></pre>`,
        `<pre><i>${epochToDateTime(event.end_time)}</i></pre>`
    );
};

module.exports = { epochToDateTime, getEpochTimestampFromSecondsAgo, formatEventMessage };