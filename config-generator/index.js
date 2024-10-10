const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const queryString = require('querystring');


// Define the folder where configuration files are stored
const configFolder = path.join(__dirname, 'config');

// Create an HTTP server
const server = http.createServer((req, res) => {

  const urlData = url.parse(req.url, true);
  const queryParams = urlData.query;


  const queryId = queryParams["id"]; // Extract the 'id' from the query string

  // Validate the 'id' format (MD5 hash of a MAC address)
  if (!isValidId(queryId)) {
    res.statusCode = 400;
    res.end('Invalid ID.');
    return;
  }

  // Check if a file with 'id.conf' exists
  const configFile = path.join(configFolder, `${queryId}.conf`);
  if (fs.existsSync(configFile)) {
    // Read and return the content of the 'id.conf' file
    fs.readFile(configFile, 'utf8', (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end('Error reading configuration file.');
      } else {
        res.setHeader('Content-Type', 'text/plain');
        res.end(data);
      }
    });
  } else {
    // Find the first 'peerx.conf' file
    const peerConfigFile = findFirstPeerConfig();
    if (!peerConfigFile) {
      res.statusCode = 404;
      res.end('No peer configuration found.');
    } else {
      // Read and return the content of the 'peerx.conf' file
      fs.readFile(peerConfigFile, 'utf8', (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end('Error reading peer configuration file.');
        } else {
          // Rename the 'peerx.conf' file to 'id.config'
          const newConfigFile = path.join(configFolder, `${queryId}.conf`);
          fs.rename(peerConfigFile, newConfigFile, (renameErr) => {
            if (renameErr) {
              res.statusCode = 500;
              res.end('Error renaming configuration file.');
            } else {
              res.setHeader('Content-Type', 'text/plain');
              res.end(data);
            }
          });
        }
      });
    }
  }
});

// Start the server on port 8080
server.listen(8080, () => {
  console.log('Server listening on port 8080');
});

// Validate the 'id' format (MD5 hash of a MAC address)
function isValidId(id) {
  return /^[a-fA-F0-9]{32}$/.test(id);
}

// Find the first 'peerx.conf' file in the config folder
function findFirstPeerConfig() {
  const files = fs.readdirSync(configFolder);
  for (const file of files) {
    if (file.startsWith('peer') && file.endsWith('.conf')) {
      return path.join(configFolder, file);
    }
  }
  return null;
}
