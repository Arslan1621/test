const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Create a mock response object that matches Vercel's interface
function createMockResponse(res) {
  return {
    status: (code) => {
      res.statusCode = code;
      return {
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end: () => res.end()
      };
    },
    json: (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    },
    setHeader: (name, value) => res.setHeader(name, value),
    writeHead: (code) => res.writeHead(code),
    end: (data) => res.end(data)
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Handle API routes
  if (req.url.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      if (body) {
        try {
          req.body = JSON.parse(body);
        } catch (e) {
          req.body = {};
        }
      }
      
      const apiPath = req.url.replace('/api/', '');
      const mockRes = createMockResponse(res);
      
      try {
        switch (apiPath) {
          case 'calculate-annual-income':
            const { default: calculateAnnualIncome } = await import('./api/calculate-annual-income.js');
            calculateAnnualIncome(req, mockRes);
            break;
          case 'calculate-taxes':
            const { default: calculateTaxes } = await import('./api/calculate-taxes.js');
            calculateTaxes(req, mockRes);
            break;
          case 'compare-scenarios':
            const { default: compareScenarios } = await import('./api/compare-scenarios.js');
            compareScenarios(req, mockRes);
            break;
          case 'tax-brackets':
            const { default: taxBrackets } = await import('./api/tax-brackets.js');
            taxBrackets(req, mockRes);
            break;
          default:
            res.writeHead(404);
            res.end('API not found');
        }
      } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
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

