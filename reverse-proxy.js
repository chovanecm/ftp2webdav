const http = require('http');
const httpProxy = require('http-proxy');

module.exports = function startProxy(targetUrl, localPort) {
    const TARGET_URL = targetUrl // Replace with your WebDAV server
    const PORT = localPort; // Local proxy port

    const proxy = httpProxy.createProxyServer({
        target: TARGET_URL,
        changeOrigin: true,
        secure: false, // Ignore invalid TLS certificates
        selfHandleResponse: true, // Handle response manually to modify Content-Length
    });

// Log request details
    proxy.on('proxyReq', (proxyReq, req, res) => {

        if (req.method === 'GET') {
            // Set custom headers for GET requests
            proxyReq.setHeader('Connection', 'TE');
            proxyReq.setHeader('TE', 'trailers');
            proxyReq.setHeader('Translate', 'f');
        } else if (req.method === "MOVE") {
            // Detect http://localost:{port} and replace it with target url in Destination header
            const destination = req.headers['destination'];
            if (destination) {
                const newDestination = destination.replace(`http://localhost:${PORT}`, TARGET_URL);
                proxyReq.setHeader('Destination', newDestination);
            }
        }

        console.log(`[${new Date().toISOString()}] ${req.method}: ${req.url}`);
        console.log(`[${new Date().toISOString()}] Request Headers:`, req.headers);
    });

// Log response details
    proxy.on('proxyRes', (proxyRes, req, res) => {
        // Log response details after sending to the client
        console.log(`[${new Date().toISOString()}] Response Status: ${proxyRes.statusCode}`);
        console.log(`[${new Date().toISOString()}] Response Headers:`, proxyRes.headers);

        proxyRes.pipe(res);

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
}
