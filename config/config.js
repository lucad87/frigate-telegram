const config = {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    frigateUrl: process.env.FRIGATE_URL,
    frigateMediaUrl: process.env.FRIGATE_MEDIA_URL || process.env.FRIGATE_URL,
    camera: process.env.CAMERA,
    zones: process.env.ZONES,
    label: process.env.LABEL
};

module.exports = config;