const util = require('util');

const epochToDateTime = (epoch) => {
    return new Date(epoch * 1000).toLocaleString();
};

const getEpochTimestampFromSecondsAgo = (seconds) => {
    const actual_dateTime = Date.now();
    return Math.floor((actual_dateTime - (seconds * 1000)) / 1000);
};

// Frigate's own recording share link: /review?timestamp=<camera>_<seconds>.
// Opening that in the UI shows the event with the viewer authenticated, which
// the raw clip endpoint (/api/events/<id>/clip.mp4) cannot do, since a link
// cannot carry credentials.
const buildReviewUrl = (event, frigateUiUrl) => {
    const timestamp = encodeURIComponent(`${event.camera}_${Math.floor(event.start_time)}`);

    return `${frigateUiUrl}/review?timestamp=${timestamp}`;
};

const formatEventMessage = (event, frigateUiUrl) => {
    const reviewUrl = buildReviewUrl(event, frigateUiUrl);

    return util.format('%s\n%s\n%s\n%s\n%s',
        '⚠️⚠️ <b>EVENT DETECTED</b> ⚠️⚠️', 
        `<pre>${event.id}</pre>`, 
        `🎥 <a href="${reviewUrl}">VIDEO LINK</a> 🎥`, 
        `<pre><i>${epochToDateTime(event.start_time)}</i></pre>`,
        `<pre><i>${epochToDateTime(event.end_time)}</i></pre>`
    );
};

module.exports = { epochToDateTime, getEpochTimestampFromSecondsAgo, buildReviewUrl, formatEventMessage };
