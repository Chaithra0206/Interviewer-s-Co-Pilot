const http = require('http');

const data = JSON.stringify({
    sessionId: "test-session-123",
    speaker: "candidate",
    text: "I built a scalable microservice architecture using Node and AWS.",
    timestamp: new Date().toISOString()
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhooks/transcript',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_key',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
