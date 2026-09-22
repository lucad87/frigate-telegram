const config = {
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
    },
    frigate: {
        url: process.env.FRIGATE_URL,
        mediaUrl: process.env.FRIGATE_MEDIA_URL || process.env.FRIGATE_URL,
        camera: process.env.CAMERA,
        zones: process.env.ZONES,
        label: process.env.LABEL,
        username: process.env.FRIGATE_USERNAME,
        password: process.env.FRIGATE_PASSWORD,
        cookieName: process.env.FRIGATE_COOKIE_NAME || 'frigate_token',
        tlsInsecure: process.env.FRIGATE_TLS_INSECURE === 'true',
        caCert: process.env.FRIGATE_CA_CERT
    },
    dateTime: {
        timezone: process.env.TIMEZONE || 'Europe/Rome',
        locales: process.env.LOCALES || 'it-IT'
    },
    polling: {
        interval: process.env.POLLING_INTERVAL || 60
    }
};

module.exports = { config };