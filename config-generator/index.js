const http = require('http');
const fs = require('fs').promises; // Use promises-based file operations
const path = require('path');
const url = require('url');
const queryString = require('querystring');

// Define the folder where configuration files are stored
const configFolder = path.join(__dirname, 'config');

// Create an HTTP server
const server = http.createServer(async (req, res) => {
  try {
    const urlData = url.parse(req.url);
    const queryParams = queryString.parse(urlData.query);
    const queryId = queryParams.id; // Extract the 'id' from the query string

    // Validate the 'id' format (MD5 hash of a MAC address)
    if (!isValidId(queryId)) {
      sendResponse(res, 400, 'Invalid ID.');
      return;
    }

    // Path for the 'id.conf' file
    const configFile = path.join(configFolder, `${queryId}.conf`);

    // Check if 'id.conf' exists
    if (await fileExists(configFile)) {
      // Read and return the content of the 'id.conf' file
      const data = await fs.readFile(configFile, 'utf8');
      sendResponse(res, 200, data, 'text/plain');
    } else {
      // Find the first 'peerx.conf' file
      const peerConfigFile = await findFirstPeerConfig();
      if (!peerConfigFile) {
        sendResponse(res, 404, 'No peer configuration found.');
        return;
      }

      // Read and return the content of the 'peerx.conf' file
      const data = await fs.readFile(peerConfigFile, 'utf8');

      // Rename 'peerx.conf' to 'id.conf'
      const newConfigFile = path.join(configFolder, `${queryId}.conf`);
      await fs.rename(peerConfigFile, newConfigFile);

      // Return the file data
      sendResponse(res, 200, data, 'text/plain');
    }
  } catch (err) {
    console.error(err);
    sendResponse(res, 500, 'Internal Server Error.');
  }
});

// Start the server on port 8080
server.listen(8080, () => {
  console.log('Server listening on port 8080');
});

/**
 * Validate the 'id' format (MD5 hash of a MAC address).
 * @param {string} id
 * @returns {boolean} Returns true if valid, otherwise false.
 */
function isValidId(id) {
  return /^[a-fA-F0-9]{32}$/.test(id);
}

/**
 * Check if a file exists.
 * @param {string} filePath Path to the file.
 * @returns {Promise<boolean>} Returns true if the file exists, otherwise false.
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find the first 'peerx.conf' file in the config folder.
 * @returns {Promise<string|null>} The path of the first 'peerx.conf' file, or null if none is found.
 */
async function findFirstPeerConfig() {
  try {
    const files = await fs.readdir(configFolder);
    for (const file of files) {
      if (file.startsWith('peer') && file.endsWith('.conf')) {
        return path.join(configFolder, file);
      }
    }
    return null;
  } catch (err) {
    console.error('Error reading config folder:', err);
    return null;
  }
}

/**
 * Send an HTTP response.
 * @param {http.ServerResponse} res HTTP response object.
 * @param {number} statusCode HTTP status code.
 * @param {string} message Response message to be sent.
 * @param {string} [contentType='text/plain'] Optional content type.
 */
function sendResponse(res, statusCode, message, contentType = 'text/plain') {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType);
  res.end(message);
}
