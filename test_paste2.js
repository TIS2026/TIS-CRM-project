const http = require('http');

const data = JSON.stringify({
  text: 'Gauri Khanna 9920048866\nAryan Dodeja 9820519364\nArjun Raghavan   9920218957',
  mode: 'Student Name + Parent Contact Number (Two Columns)'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/opportunities/paste',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
