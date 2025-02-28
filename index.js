const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const https = require("https");

const TARGET_URL = "https://webdav.pkilab.internal"; // WebDAV server with invalid SSL

const app = express();

// Proxy middleware configuration
const proxy = createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  secure: false, // Ignore invalid SSL certificates
  agent: new https.Agent({ rejectUnauthorized: false }), // Force ignoring SSL errors
  logger: console,
  on: {
    proxyReq: (proxyReq, req, res) => {
    // Forward Basic Auth if provided
   /* if (req.headers.authorization) {
      proxyReq.setHeader("Authorization", req.headers.authorization);
   }*/
      console.log(`\n=== HTTP REQUEST ===`);
      console.log(`${req.method} ${req.url}`);
      console.log('Headers:', req.headers);
      if (req.body) {
        console.log('Body:', req.body);
      }
  },
  proxyRes: (proxyRes, req, res) => {
    // Forward Basic Auth if provided
   /* if (req.headers.authorization) {
      proxyReq.setHeader("Authorization", req.headers.authorization);
   }*/
      let body = [];
      proxyRes.on('data', (chunk) => {
        body.push(chunk);
      });
      proxyRes.on('end', () => {
        body = Buffer.concat(body).toString();
        console.log(`\n=== HTTP RESPONSE ===`);
        console.log(`Status: ${proxyRes.statusCode}`);
        console.log('Headers:', proxyRes.headers);
        //console.log('Body:', body);
      });
  },
}
});

// Use the proxy for all requests
app.use("/", proxy);

const PORT = 8080; // Expose the local WebDAV proxy over HTTP
app.listen(PORT, () => {
  console.log(`Reverse proxy running at http://localhost:${PORT}`);
});
