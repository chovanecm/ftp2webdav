# FTP to WebDAV Gateway

This project starts an FTP server that uses a WebDAV connection as its backend. This allows a regular FTP client to manipulate files stored in a WebDAV repository.

It is built on [ftp-srv](https://github.com/QuorumDMS/ftp-srv) and [webdav-fs](https://github.com/perry-mitchell/webdav-fs).

## Prerequisites

- Node.js
- npm

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/chovanecm/ftp2webdav
    cd ftp2webdav
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

This will start the FTP server and a reverse HTTP proxy. The FTP server will listen on the port specified in the `.env` file (default is 21). 
The FTP server translates FTP commands to HTTP requests that are routed through a locally running reverse HTTP proxy and then to the remote WebDAV repository. The reverse proxy will listen on the port specified in the `.env` file (default is 8080).

The reverse proxy is used to tweak HTTP requests to the WebDAV server due to compatibility issues discovered during the development.

### Supported operations

ftp2webdav supports browsing of directories, deleting files, uploading files, and perhaps more. Not all FTP commands are supported, though.

Tested with Microsoft IIS WebDAV server.

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
