const http = require('http');
const httpProxy = require('http-proxy');
const zlib = require("zlib");

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
        }

        console.log(`[${new Date().toISOString()}] ${req.method}: ${req.url}`);
        console.log(`[${new Date().toISOString()}] Request Headers:`, req.headers);
    });

// Log response details
    proxy.on('proxyRes', (proxyRes, req, res) => {
        // Log response details after sending to the client
        console.log(`[${new Date().toISOString()}] Response Status: ${proxyRes.statusCode}`);
        console.log(`[${new Date().toISOString()}] Response Headers:`, proxyRes.headers);
        if (req.method === 'GET' || true) {
            let body = [];

            proxyRes.on('data', (chunk) => {
                body.push(chunk);
            });

            proxyRes.on('end', () => {
                body = Buffer.concat(body);
                res.statusCode = proxyRes.statusCode;
                res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/octet-stream');
                res.setHeader('Content-Length', body.length);
                res.setHeader('Cache-Control', proxyRes.headers['cache-control'] || 'no-cache');
                res.setHeader('Last-Modified', proxyRes.headers['last-modified'] || new Date().toUTCString());
                res.setHeader('ETag', proxyRes.headers['etag'] || '');
                res.setHeader('Connection', 'close');

                compressResponse(req, res, body);
            });
        } else {
            proxyRes.pipe(res);
        }
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


// Function to compress response
    function compressResponse(req, res, body) {
        const acceptEncoding = req.headers['accept-encoding'] || '';

        if (acceptEncoding.includes('gzip')) {
            zlib.gzip(body, (err, compressed) => {
                if (!err) {
                    res.setHeader('Content-Encoding', 'gzip');
                    res.setHeader('Content-Length', compressed.length);
                    res.end(compressed);
                } else {
                    res.end(body); // Fallback to uncompressed response
                }
            });
        } else if (acceptEncoding.includes('deflate')) {
            zlib.deflate(body, (err, compressed) => {
                if (!err) {
                    res.setHeader('Content-Encoding', 'deflate');
                    res.setHeader('Content-Length', compressed.length);
                    res.end(compressed);
                } else {
                    res.end(body);
                }
            });
        } else {
            res.end(body); // No compression supported by client
        }
    }

}
