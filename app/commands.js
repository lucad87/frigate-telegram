/*
    Single source of truth for the bot's commands: the Telegram menu
    (setMyCommands), the /help reply and the message dispatcher are all built
    from COMMANDS.

    Parsing is deliberately forgiving. Telegram adds an @mention when a command
    is picked from the menu in a group (`/events@the_bot 10`), clients differ in
    where they put the space, and the mention can end up glued to the argument
    (`/events@the_bot10`), which an anchored `^/command$` test ignores entirely.
*/
const { epochToDateTime, buildReviewUrl } = require('./utils.js');

const DEFAULT_EVENTS_LIMIT = 5;
const MAX_EVENTS_LIMIT = 10;

const COMMANDS = [
    { command: 'help', description: 'Mostra i comandi disponibili' },
    { command: 'status', description: 'Stato di Frigate e delle telecamere' },
    { command: 'events', description: `Ultimi eventi (default ${DEFAULT_EVENTS_LIMIT}, max ${MAX_EVENTS_LIMIT})` },
    { command: 'enable_notifications', description: 'Attiva le notifiche' },
    { command: 'disable_notifications', description: 'Disattiva le notifiche' }
];

// Not listed in the menu, but a new user pressing START in the private chat
// still gets an answer
const ALIASES = { start: 'help' };

// longest first, so `enable_notifications` is matched before a shorter prefix
const COMMAND_NAMES = [...COMMANDS.map((entry) => entry.command), ...Object.keys(ALIASES)]
    .sort((first, second) => second.length - first.length);

const parseCommand = (text, botUsername) => {
    if (typeof text !== 'string') {
        return undefined;
    }

    const value = text.trim();

    if (!value.startsWith('/')) {
        return undefined;
    }

    const lowered = value.toLowerCase();
    const name = COMMAND_NAMES.find((entry) => lowered.startsWith(`/${entry}`));

    if (!name) {
        return undefined;
    }

    let rest = value.slice(1 + name.length);

    // drop the @mention, exactly when the bot username is known (so a glued
    // argument survives), otherwise in its generic form
    if (botUsername && rest.toLowerCase().startsWith(`@${botUsername.toLowerCase()}`)) {
        rest = rest.slice(1 + botUsername.length);
    } else {
        rest = rest.replace(/^@[a-z0-9_]+/i, '');
    }

    // `/help_bot` must not be read as `/help`
    if (/^[a-z_]/i.test(rest)) {
        return undefined;
    }

    const argumentsText = rest.trim();

    return {
        command: ALIASES[name] || name,
        args: argumentsText ? argumentsText.split(/\s+/).filter(Boolean) : []
    };
};

const helpMessage = () => [
    'Comandi disponibili:',
    ...COMMANDS.map((entry) => `/${entry.command} - ${entry.description}`)
].join('\n');

// /events [n] - the first number in the arguments wins, so `/events 10`,
// `/events=10` and `/events 10.` all mean ten
const parseEventsLimit = (args) => {
    const match = (args || []).join(' ').match(/\d+/);

    if (!match) {
        return DEFAULT_EVENTS_LIMIT;
    }

    return Math.min(Math.max(Number.parseInt(match[0], 10), 1), MAX_EVENTS_LIMIT);
};

// the API reports storage in megabytes
const megabytesToGigabytes = (megabytes) => Math.round(Number(megabytes) / 1024);

const formatUptime = (seconds) => {
    const total = Math.floor(Number(seconds) || 0);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    if (days > 0) {
        return `${days}g ${hours}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
};

const formatStatus = (stats, version, notificationsEnabled) => {
    const lines = [`Frigate ${version} · attivo da ${formatUptime(stats?.service?.uptime)}`];

    const detectors = Object.entries(stats?.detectors || {});

    if (detectors.length > 0) {
        lines.push(`detector: ${detectors.map(([name, detector]) => `${name} ${detector.inference_speed} ms`).join(', ')}`);
    }

    const cameras = Object.entries(stats?.cameras || {});

    if (cameras.length > 0) {
        lines.push('telecamere:');

        for (const [name, camera] of cameras) {
            const detection = camera.detection_enabled ? 'detection ON' : 'detection OFF';
            const quality = camera.connection_quality ? ` · ${camera.connection_quality}` : '';

            lines.push(`• ${name} · ${detection} · ${camera.camera_fps} fps${quality}`);
        }
    }

    const storage = stats?.service?.storage?.['/media/frigate/recordings'];

    if (storage) {
        lines.push(`archivio: ${megabytesToGigabytes(storage.free)} GB liberi su ${megabytesToGigabytes(storage.total)} GB`);
    }

    lines.push(`notifiche del bot: ${notificationsEnabled ? 'attive' : 'sospese'}`);

    const latest = stats?.service?.latest_version;
    const current = String(version || '');

    if (latest && !current.startsWith(String(latest))) {
        lines.push(`aggiornamento Frigate disponibile: ${latest}`);
    }

    return lines.join('\n');
};

const formatEventList = (events, frigateUiUrl, limit, options = {}) => {
    const list = (Array.isArray(events) ? [...events] : [])
        .sort((first, second) => second.start_time - first.start_time)
        .slice(0, limit);

    if (list.length === 0) {
        return 'Nessun evento recente.';
    }

    const lines = [`Ultimi ${list.length} eventi:`];

    list.forEach((event, index) => {
        const label = event.sub_label ? `${event.label} (${event.sub_label})` : event.label;

        lines.push(`${index + 1}. ${label} · ${event.camera} · ${epochToDateTime(event.start_time)}`);
        lines.push(buildReviewUrl(event, frigateUiUrl));
    });

    if (options.showLimitHint) {
        lines.push('', `Per cambiare il numero: /events N (max ${MAX_EVENTS_LIMIT})`);
    }

    return lines.join('\n');
};

module.exports = {
    COMMANDS,
    parseCommand,
    helpMessage,
    parseEventsLimit,
    formatStatus,
    formatEventList
};
