const http = require('http');
const fs = require('fs').promises; // Use promises-based file operations
const path = require('path');
const url = require('url');

// Define the folder where configuration files are stored
const configFolder = path.join(__dirname, 'config');

// Create an HTTP server
const server = http.createServer(async (req, res) => {
  try {
    const urlData = url.parse(req.url, true);
    const queryId = urlData.query.id; // Extract the 'id' from the query string

    // Validate the 'id' format (MD5 hash of a MAC address)
    if (!isValidId(queryId)) {
      sendResponse(res, 400, 'Invalid ID.');
      return;
    }

    // Path for 'id.conf'
    const configFile = path.join(configFolder, `${queryId}.conf`);

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

      // Read and rename 'peerx.conf' to 'id.conf'
      const data = await fs.readFile(peerConfigFile, 'utf8');
      const newConfigFile = path.join(configFolder, `${queryId}.conf`);
      await fs.rename(peerConfigFile, newConfigFile); // Rename peer config to the specific id
      sendResponse(res, 200, data, 'text/plain');
    }
  } catch (err) {
    // Handle unexpected errors
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
 * Utility function to check if a file exists.
 * @param {string} filePath
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
 * Send a response to the client.
 * @param {http.ServerResponse} res
 * @param {number} statusCode HTTP status code
 * @param {string} message Response message
 * @param {string} contentType Optional content type, defaults to 'text/plain'
 */
function sendResponse(res, statusCode, message, contentType = 'text/plain') {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType);
  res.end(message);
}
