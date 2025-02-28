const http = require('http');
const httpProxy = require('http-proxy');

const TARGET_URL = 'https://webdav.pkilab.internal'; // Replace with your WebDAV server
const PORT = 8080; // Local proxy port

const proxy = httpProxy.createProxyServer({
    target: TARGET_URL,
    changeOrigin: true,
    secure: false, // Ignore invalid TLS certificates
   // selfHandleResponse: true, // Handle response manually to modify Content-Length
});

// Log request details
proxy.on('proxyReq', (proxyReq, req, res) => {
    console.log(`[${new Date().toISOString()}] Request URL: ${req.url}`);
    console.log(`[${new Date().toISOString()}] Request Headers:`, req.headers);
});

// Log response details
proxy.on('proxyRes', (proxyRes, req, res) => {
      // Log response details after sending to the client
      console.log(`[${new Date().toISOString()}] Response Status: ${proxyRes.statusCode}`);
      console.log(`[${new Date().toISOString()}] Response Headers:`, proxyRes.headers);
     
    proxyRes.on('error', (err) => {
        console.error('Error with the target response:', err);
        res.writeHead(502);
        res.end('Bad Gateway');
    });
});

const server = http.createServer({
  keepAlive: false
}, (req, res) => {
    proxy.web(req, res);
});

server.listen(PORT, () => {
    console.log(`Reverse proxy running at http://localhost:${PORT}`);
});