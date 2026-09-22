const axios = require('axios').default;
const logger = require('./logger.js');
const { getTlsConfig } = require('./frigateTls.js');
const { frigate } = require('../config/settings.js').config;

/*
    Frigate authenticates API requests with a JWT, not with HTTP Basic auth.
    Credentials are exchanged for a token on POST /api/login; the token is then
    sent as `Authorization: Bearer <token>`. On port 8971 (or behind a reverse
    proxy) every request without a valid token is answered with 401, which is
    why sending Basic credentials never worked.

    Tokens are valid for `auth.session_length` (24 hours by default) and Frigate
    only refreshes the cookie variant automatically, so a new login is performed
    here before the token expires.
*/
const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;

let cachedToken = null;
let cachedTokenExpiresAt = 0;
let loginInFlight = null;
let authDisabled = false;

const hasCredentials = () => Boolean(frigate.username && frigate.password);

const looksLikeJwt = (value) => typeof value === 'string' && value.split('.').length === 3;

const decodeExpiration = (token) => {
    try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
        return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
    } catch (error) {
        logger.warn(`Could not read the expiration from the Frigate token: ${error.message}`);
        return 0;
    }
};

// The token is delivered as an HTTP-only cookie; the JWT can be taken from
// there and reused as a Bearer token (Frigate supports both).
const extractToken = (response) => {
    const cookies = response.headers['set-cookie'] || [];
    const entries = cookies.map((cookie) => cookie.split(';')[0]);

    const configured = entries.find((entry) => entry.startsWith(`${frigate.cookieName}=`));
    const matched = configured
        || entries.find((entry) => looksLikeJwt(entry.slice(entry.indexOf('=') + 1)));

    return matched ? matched.slice(matched.indexOf('=') + 1) : null;
};

const login = async () => {
    try {
        const response = await axios.post(`${frigate.url}/api/login`, {
            user: frigate.username,
            password: frigate.password
        }, getTlsConfig());

        const token = extractToken(response);

        if (!token) {
            throw new Error('Frigate accepted the login but returned no token');
        }

        cachedToken = token;
        cachedTokenExpiresAt = decodeExpiration(token);
        logger.info('Authenticated with Frigate, JWT token acquired');

        return cachedToken;
    } catch (error) {
        // Frigate answers 404 when authentication is disabled in its config
        if (error.response && error.response.status === 404) {
            logger.warn('Frigate authentication is disabled, continuing without credentials');
            authDisabled = true;
            return null;
        }

        if (error.response && error.response.status === 401) {
            throw new Error('Frigate login failed: check FRIGATE_USERNAME and FRIGATE_PASSWORD');
        }

        throw error;
    }
};

const getAuthHeaders = async () => {
    if (!hasCredentials() || authDisabled) {
        return {};
    }

    const now = Date.now();

    if (cachedToken && (cachedTokenExpiresAt === 0 || cachedTokenExpiresAt - TOKEN_REFRESH_MARGIN_MS > now)) {
        return { Authorization: `Bearer ${cachedToken}` };
    }

    // Share a single login between concurrent requests
    if (!loginInFlight) {
        loginInFlight = login().finally(() => { loginInFlight = null; });
    }

    const token = await loginInFlight;

    return token ? { Authorization: `Bearer ${token}` } : {};
};

const invalidateToken = () => {
    cachedToken = null;
    cachedTokenExpiresAt = 0;
};

const getRequestConfig = async () => ({
    ...getTlsConfig(),
    headers: await getAuthHeaders()
});

/*
    Runs a request with the current token and retries once with a fresh one when
    Frigate rejects it (for example after the token secret changed or the session
    expired while polling).
*/
const withFrigateAuth = async (request) => {
    try {
        return await request(await getRequestConfig());
    } catch (error) {
        const status = error.response && error.response.status;

        if (status === 401 && hasCredentials() && !authDisabled) {
            logger.warn('Frigate rejected the token, authenticating again');
            invalidateToken();
            return await request(await getRequestConfig());
        }

        if (status === 401) {
            logger.warn('Frigate answered 401. Set FRIGATE_USERNAME and FRIGATE_PASSWORD if authentication is enabled, or point FRIGATE_URL at the internal unauthenticated port (5000)');
        }

        throw error;
    }
};

module.exports = { withFrigateAuth, hasCredentials, invalidateToken };
