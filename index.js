require('dotenv').config();

const { FtpSrv} =require('ftp-srv');
const { Agent } = require("https");
const { createAdapter } = require("webdav-fs");
const WebDavFileSystem = require("./WebDavFileSystem");
const reverseProxy = require('./reverse-proxy');

// Set default values using logical OR (||) if the environment variable is not set
const webdavServerUrl = process.env.WEBDAV_URL;
const FTP_PORT = Number(process.env.FTP_PORT) || 21;
const REVERSE_PROXY_PORT = Number(process.env.REVERSE_PROXY_PORT) || 8080;
const REVERSE_PROXY_URL = `http://localhost:${REVERSE_PROXY_PORT}`;
const WEBDAV_IGNORE_SSL = process.env.WEBDAV_IGNORE_SSL === 'true' || true;
const FTP_LISTEN_ON = process.env.FTP_LISTEN_ON || 'localhost';


reverseProxy(webdavServerUrl, REVERSE_PROXY_PORT);


const ftp = new FtpSrv({
  url: `ftp://${FTP_LISTEN_ON}:${FTP_PORT}`,
  anonymous: false,
  greeting: 'FTP-to-WebDAV Gateway',
});

ftp.on('login', ({ username, password }, resolve, reject) => {

    const agent = new Agent({
      keepAlive: true,
      rejectUnauthorized: !WEBDAV_IGNORE_SSL
    });
    const wfs = createAdapter(REVERSE_PROXY_URL, {
      username,
      password,
      httpsAgent: agent
    });


  resolve({
    fs: new WebDavFileSystem(wfs)
  });
});




ftp.listen();
console.log(`FTP server listening on port ${FTP_PORT}`);
