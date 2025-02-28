# FTP to WebDAV Gateway

This project sets up an FTP server that proxies requests to a WebDAV server. It includes a reverse proxy to monitor HTTP communication and tweak HTTP headers to the WebDAV server.

## Prerequisites

- Node.js
- npm

## Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Copy the `.env.example` file to `.env` and update the environment variables as needed:
    ```sh
    cp .env.example .env
    ```

## Configuration

Update the `.env` file with your WebDAV server details and other configurations:

```dotenv
WEBDAV_URL=https://webdav.yourdomain.com
WEBDAV_IGNORE_SSL=true
FTP_LISTEN_ON=localhost
FTP_PORT=21
REVERSE_PROXY_PORT=8080
```

## Usage

Start the FTP to WebDAV gateway:

```sh
npm start
```

This will start the FTP server and the reverse proxy. The FTP server will listen on the port specified in the `.env` file (default is 21), and the reverse proxy will listen on the port specified in the `.env` file (default is 8080).

## Project Structure

- `index.js`: Main entry point of the application. Configures and starts the FTP server and reverse proxy.
- `reverse-proxy.js`: Sets up the reverse proxy to monitor and tweak HTTP communication to the WebDAV server.
- `WebDavFileSystem.js`: Custom FTP FileSystem adapter for WebDAV.
- `.env.example`: Example environment configuration file.
- `package.json`: Project metadata and dependencies.

## Logging

The reverse proxy logs HTTP requests and responses to the console, including method, URL, headers, and status codes.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
