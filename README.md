# Frigate-Telegram

This project is a Telegram bot integration for Frigate, an open-source NVR (Network Video Recorder) software. It allows users to receive real-time alert notifications from their Frigate instance directly in Telegram.

## Table of Contents
- [About](#about)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Frigate Authentication](#frigate-authentication)
  - [Volumes](#volumes)
  - [Docker Compose Configuration](#docker-compose-configuration)
- [Usage](#usage)
- [Development](#development)
- [License](#license)

## About
The application is written in Node.js and polls the Frigate API to fetch new events. When a new event is detected, it is forwarded to Telegram, including event details, a clickable video link with 30 seconds padding, a static thumbnail, and an animated preview GIF.

This project aims to retrieve events from Frigate using its API without relying on external tools like Home Assistant. MQTT is not supported.

The application polls Frigate every 60 seconds -by default- to fetch new alerts. The GET request to the Frigate API retrieves events from the last 60 seconds, filtered by the parameters specified in the `docker-compose` file (label, camera, and zones). You can customize it with `POLLING_INTERVAL`: it will set the same value for both application `polling interval` and frigate `after`.

## Docker hub
https://hub.docker.com/r/lucad87/frigate-telegram

## Features
- **Real-time Notifications**: Receive instant alerts on your Telegram chat when Frigate detects specified objects.
- **Rich Media**: Each notification includes:
  - Event details (ID, timestamps)
  - Clickable video link with 30 seconds padding before/after the event
  - Static thumbnail image
  - Animated preview GIF
- **Authentication Support**: Secure access to Frigate API using username and password, exchanged for a JWT token as Frigate requires.
- **Bot Commands**: Interact with the bot via Telegram commands. Use `/start` or `/help` to see available commands, `/enable_notifications` to enable notifications, and `/disable_notifications` to disable them.
- **Customizable**: Configure the bot to monitor specific cameras, zones, and object labels.
- **Retry Logic**: Automatically retries fetching media if not immediately available.
- **Debugging**: Enable debug logging for troubleshooting and development purposes.
- **Media URL Support**: Optionally set a public URL for accessing Frigate media files.

## Getting Started

To get the Frigate-Telegram bot up and running, follow these steps:

### Environment Variables
These variables are essential for the bot's operation and should be configured in your `docker-compose.yml` file:
- `FRIGATE_URL`: The URL of your Frigate instance (e.g., `http://192.168.1.7:5000`, or `http://192.168.1.7:8971` when authentication is enabled).
- `FRIGATE_MEDIA_URL`: (Optional) The public URL of your Frigate media files (e.g., `https://your-media-frigate-instance.com`). It should be reachable **without authentication**, because the video links are sent to Telegram without credentials.
- `FRIGATE_USERNAME`: (Optional) Username for Frigate authentication. Required if your Frigate instance has authentication enabled.
- `FRIGATE_PASSWORD`: (Optional) Password for Frigate authentication. Required if your Frigate instance has authentication enabled.
- `FRIGATE_COOKIE_NAME`: (Optional) Name of the Frigate session cookie holding the JWT, `frigate_token` by default. Only needed if you changed `auth.cookie_name` in your Frigate configuration.
- `TELEGRAM_BOT_TOKEN`: The token for your Telegram bot.
- `TELEGRAM_CHAT_ID`: The chat ID where notifications will be sent.
- `CAMERA`: The name of the frigate camera to monitor.
- `ZONES`: The frigate zones to monitor for object detection (e.g., `front,back,street`).
- `LABEL`: The frigate object label to monitor (e.g., `person`).
- `TIMEZONE`: Your time zone, `Europe/Rome` is the default
- `LOCALES`: Your locales language according the timezone, `it-IT` is the default
- `POLLING_INTERVAL`: Interval in seconds to poll Frigate for new events (default: 60 seconds).
- `DEBUG`: (Optional) Set to `true` to enable debug logging.

### Frigate Authentication
Frigate authenticates its API with a JWT, not with HTTP Basic auth, and it behaves differently depending on the port you point `FRIGATE_URL` at:

| Frigate port | Authentication | How to configure |
| --- | --- | --- |
| `5000` | None (internal, unauthenticated) | `FRIGATE_URL=http://<frigate-host>:5000` and no credentials. Recommended when the bot runs in the same Docker network: this is the port Frigate reserves for integrations that do not implement its authentication. Keep it reachable only from trusted networks, since it is not protected. |
| `8971` | Enabled (JWT) | `FRIGATE_URL=https://<frigate-host>:8971` plus `FRIGATE_USERNAME` and `FRIGATE_PASSWORD`. The bot logs in on `POST /api/login`, reuses the returned token as `Authorization: Bearer`, and logs in again before it expires. |

Notes:
- Credentials are only used if **both** `FRIGATE_USERNAME` and `FRIGATE_PASSWORD` are set.
- The token is valid for Frigate's `auth.session_length` (24 hours by default) and is renewed automatically; if Frigate rejects it (for example after `FRIGATE_JWT_SECRET` changes), the bot authenticates again on the next request.
- A `401` in the logs means Frigate is answering unauthenticated: either set the credentials for port `8971`, or move to port `5000`.
- If you want the video links in Telegram to open for the recipients, `FRIGATE_MEDIA_URL` must point at an endpoint that does not require authentication, as those links cannot carry credentials.

### Volumes
- `./logs:/app/logs`: Mounts the logs directory to persist log files.

### Docker Compose Configuration
Below is an example `docker-compose.yml` configuration. Replace the placeholder values with your actual settings.

```yaml
services:
  app:
    image: lucad87/frigate-telegram:latest
    environment:
      - FRIGATE_URL=<your-frigate-instance-url> # e.g. http://frigate:5000 (no auth) or https://frigate.example.com:8971 (JWT auth)
      - FRIGATE_MEDIA_URL=<your-public-media-frigate-instance-url> # (optional) It fallbacks on FRIGATE_URL if not specified, it should not require authentication
      - FRIGATE_USERNAME=<your-frigate-username> # (optional) Required if Frigate has authentication enabled (port 8971)
      - FRIGATE_PASSWORD=<your-frigate-password> # (optional) Required if Frigate has authentication enabled (port 8971)
      - FRIGATE_COOKIE_NAME=<your-frigate-cookie-name> # (optional) Only if you changed auth.cookie_name in Frigate, frigate_token is the default
      - TELEGRAM_BOT_TOKEN=<your-telegram-token>
      - TELEGRAM_CHAT_ID=<your-telegram-chat-id>
      - CAMERA=<frigate-camera>
      - ZONES=<frigate-zones>
      - LABEL=<frigate-label>
      - TIMEZONE=<you_timezone> # (optional) Set to the timezone to use for the date and time in the messages, Europe/Rome is the default
      - LOCALES=<locales> # (optional) Set to the locale to use for the date and time in the messages, it-IT is the default
      - POLLING_INTERVAL=<seconds> # (optional) Set to the interval in seconds to poll Frigate for new events, 60 seconds is the default
      - DEBUG=false # (optional) Set to true to enable debug logging
    volumes:
      - <your-logs-volume-path>:/app/logs
    restart: unless-stopped
```

### Usage

1.  **Pull the Docker image**:
    ```sh
    docker pull lucad87/frigate-telegram:latest
    ```

2.  **Run the container using Docker Compose**:
    Navigate to the directory containing your `docker-compose.yml` file and run:
    ```sh
    docker compose up -d
    ```

 3.  **Control the Bot via Telegram**:
     Once the bot is running, you can interact with it by sending commands directly to your bot in Telegram:
     - `/start` or `/help`: Show available commands.
     - `/enable_notifications`: Enable event notifications.
     - `/disable_notifications`: Disable event notifications.

## Development

To set up the project for local development:

1.  **Clone the repository**:
    ```sh
    git clone https://github.com/lucad87/frigate-telegram.git
    cd frigate-telegram
    ```

2.  **Install dependencies**:
    ```sh
    npm install
    ```

3.  **Run the application**:
    You will need to set up environment variables (e.g., in a `.env` file or directly in your shell) as described in the [Environment Variables](#environment-variables) section.
    ```sh
    node app/index.js
    ```

## License

This project is licensed as MIT.
