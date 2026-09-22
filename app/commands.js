/*
    Single source of truth for the bot's commands: the Telegram menu
    (setMyCommands) and the /help reply are both generated from COMMANDS.

    Commands are matched loosely on purpose: in a group Telegram sends
    `/command@the_bot` when the command is picked from the menu, and clients may
    add spacing, so an anchored `^/command$` test silently ignores them.
*/
const COMMANDS = [
    { command: 'help', description: 'Mostra i comandi disponibili' },
    { command: 'enable_notifications', description: 'Attiva le notifiche' },
    { command: 'disable_notifications', description: 'Disattiva le notifiche' }
];

// Not listed in the menu, but a new user pressing START in the private chat
// still gets an answer
const ALIASES = { start: 'help' };

const COMMAND_PATTERN = /^\/([a-z_]+)(?:@[a-z0-9_]+)?$/i;

const parseCommand = (text) => {
    if (typeof text !== 'string') {
        return undefined;
    }

    const match = text.trim().match(COMMAND_PATTERN);

    if (!match) {
        return undefined;
    }

    const name = match[1].toLowerCase();
    const resolved = ALIASES[name] || name;

    return COMMANDS.some((entry) => entry.command === resolved) ? resolved : undefined;
};

const helpMessage = () => [
    'Comandi disponibili:',
    ...COMMANDS.map((entry) => `/${entry.command} - ${entry.description}`)
].join('\n');

module.exports = { COMMANDS, parseCommand, helpMessage };
