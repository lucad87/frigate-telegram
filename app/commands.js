/*
    Single source of truth for the bot's commands: the Telegram menu
    (setMyCommands), the /help reply and the message dispatcher are all built
    from COMMANDS.

    Commands are matched loosely on purpose: in a group Telegram sends
    `/command@the_bot` when the command is picked from the menu, and clients may
    add spacing, so an anchored `^/command$` test silently ignores them.
*/
const { epochToDateTime, buildReviewUrl } = require('./utils.js');

const DEFAULT_EVENTS_LIMIT = 5;
const MAX_EVENTS_LIMIT = 10;

const COMMANDS = [
    { command: 'help', description: 'Mostra i comandi disponibili' },
    { command: 'status', description: 'Stato di Frigate e delle telecamere' },
    { command: 'events', description: `Ultimi eventi, /events [n] (default ${DEFAULT_EVENTS_LIMIT})` },
    { command: 'enable_notifications', description: 'Attiva le notifiche' },
    { command: 'disable_notifications', description: 'Disattiva le notifiche' }
];

// Not listed in the menu, but a new user pressing START in the private chat
// still gets an answer
const ALIASES = { start: 'help' };

const COMMAND_PATTERN = /^\/([a-z_]+)(?:@[a-z0-9_]+)?(?:\s+([\s\S]*))?$/i;

const parseCommand = (text) => {
    if (typeof text !== 'string') {
        return undefined;
    }

    const match = text.trim().match(COMMAND_PATTERN);

    if (!match) {
        return undefined;
    }

    const name = match[1].toLowerCase();
    const command = ALIASES[name] || name;

    if (!COMMANDS.some((entry) => entry.command === command)) {
        return undefined;
    }

    return {
        command,
        args: (match[2] || '').trim().split(/\s+/).filter(Boolean)
    };
};

const helpMessage = () => [
    'Comandi disponibili:',
    ...COMMANDS.map((entry) => `/${entry.command} - ${entry.description}`)
].join('\n');

// /events [n]
const parseEventsLimit = (args) => {
    const requested = (args && args[0]) || '';

    if (!/^\d+$/.test(requested)) {
        return DEFAULT_EVENTS_LIMIT;
    }

    return Math.min(Math.max(Number.parseInt(requested, 10), 1), MAX_EVENTS_LIMIT);
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

const formatEventList = (events, frigateUiUrl, limit) => {
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
