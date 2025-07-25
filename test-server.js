const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import API handlers
const calculateAnnualIncome = require('./api/calculate-annual-income.js').default;
const calculateTaxes = require('./api/calculate-taxes.js').default;
const compareScenarios = require('./api/compare-scenarios.js').default;
const taxBrackets = require('./api/tax-brackets.js').default;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Handle API routes
  if (req.url.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      if (body) {
        try {
          req.body = JSON.parse(body);
        } catch (e) {
          req.body = {};
        }
      }
      
      const apiPath = req.url.replace('/api/', '');
      
      switch (apiPath) {
        case 'calculate-annual-income':
          calculateAnnualIncome(req, res);
          break;
        case 'calculate-taxes':
          calculateTaxes(req, res);
          break;
        case 'compare-scenarios':
          compareScenarios(req, res);
          break;
        case 'tax-brackets':
          taxBrackets(req, res);
          break;
        default:
          res.writeHead(404);
          res.end('API not found');
      }
    });
    return;
  }
  
  // Serve static files
  let filePath = req.url === '/' ? '/public/index.html' : '/public' + req.url;
  filePath = path.join(__dirname, filePath);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.ico': 'image/x-icon'
    }[ext] || 'text/plain';
    
    res.setHeader('Content-Type', contentType);
    res.writeHead(200);
    res.end(data);
  });
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Server running on http://localhost:3001');
});
