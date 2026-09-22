const fs = require('fs');
const https = require('https');
const logger = require('./logger.js');
const { frigate } = require('../config/settings.js').config;

/*
    Frigate serves its authenticated port (8971) with a self-signed certificate
    ("FRIGATE DEFAULT CERT") unless TLS is configured. Node rejects that
    certificate by default, so authenticating against 8971 directly fails with a
    certificate error before the credentials are even used.

    Two ways to make the bot trust it:
      - FRIGATE_CA_CERT: path to the PEM of the CA/certificate to trust (preferred)
      - FRIGATE_TLS_INSECURE=true: disable certificate validation (last resort)
*/
let agent = null;
let resolved = false;

const buildAgent = () => {
    if (frigate.caCert) {
        logger.info(`Trusting the Frigate certificate from ${frigate.caCert}`);
        // Frigate's default certificate is issued for `CN = *`, so a hostname
        // match against an IP or host is impossible. The chain is still
        // validated against the pinned certificate, only the name check is skipped.
        return new https.Agent({
            ca: fs.readFileSync(frigate.caCert),
            checkServerIdentity: () => undefined
        });
    }

    if (frigate.tlsInsecure) {
        logger.warn('FRIGATE_TLS_INSECURE is enabled: the Frigate certificate is not verified');
        return new https.Agent({ rejectUnauthorized: false });
    }

    return null;
};

const getTlsConfig = () => {
    if (!resolved) {
        agent = buildAgent();
        resolved = true;
    }

    return agent ? { httpsAgent: agent } : {};
};

module.exports = { getTlsConfig };
