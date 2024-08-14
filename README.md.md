# Frigate-Telegram

This project is a Telegram bot integration for Frigate, an open-source NVR (Network Video Recorder) software. It allows users to receive real-time alerts notifications from their Frigate instance directly in Telegram. 

The application is written in Node. It simply does a polling each minute to Frigate APIs in order to receive new events. If a new event is received, it is forwarded to Telegram including several event details and a thumbnail.

This project aims to receive events from Frigate using its APIs without relying on external tools like Home Assistant. 

MQTT is not supported.


## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [License](#license)


## Installation

Step-by-step instructions on how to get your project up and running.

```sh
# Clone the repository
git clone https://github.com/yourusername/your-repo-name.git

# Navigate to the project directory
cd your-repo-name

# Install dependencies
npm install
```


## Usage

Make sure you have Docker and Docker Compose installed.

You need a Telegram Bot and its Token in order to use this app.

### Build the image and create the docker container

1. Assuming you are in the project directory.
    - Open the **docker-compose.yml** and configure your environment variables as needed.
2. Run the following command to build and start the containers:

```sh
# docker compose
docker compose up --build
```


## Features

- Real-time alerts notifications from Frigate instance in Telegram
- Polling Frigate APIs for new events
- Forwarding new events to Telegram with event details and thumbnail
- Independent of external tools like Home Assistant
- No MQTT support


## License

This project is licensed as MIT.
