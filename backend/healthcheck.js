const http = require('http');

const options = {
  host: process.env.HEALTH_CHECK_HOST || 'localhost',
  port: process.env.PORT || 5000,
  path: process.env.HEALTH_CHECK_PATH || '/health',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log('Health check failed');
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.log('Health check failed:', err);
  process.exit(1);
});

request.end();