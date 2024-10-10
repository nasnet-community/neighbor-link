const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 19119;

// File paths as variables
const userFilePath = '/etc/chisel/users.json';
const portFilePath = './assignedport.json';
const o_portFilePath = './o_assignedport.json';

const portRange=19120
const portCount=41

const o_portRange=52120
const o_portCount=41

app.get('/assign', (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.json({ code: 0, port: null });
    }

    const users = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
    const assignedPorts = JSON.parse(fs.readFileSync(portFilePath, 'utf8'));
    const o_assignedPorts = JSON.parse(fs.readFileSync(o_portFilePath, 'utf8'));

    // Reverse the token to get the password
    const password = token.split('').reverse().join('');
    users[`${token}:${password}`] = [""];

    // Write to user.json
    fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));

    let port = assignedPorts[token];
    if (!port) {
        // Find a random port that's not already assigned
        const availablePorts = Array.from({ length: portCount }, (_, i) => i + portRange)
            .filter(p => !Object.values(assignedPorts).includes(p));

        if (availablePorts.length === 0) {
            return res.json({ code: -1, port: null });
        }

        port = availablePorts[Math.floor(Math.random() * availablePorts.length)];
        assignedPorts[token] = port;

        // Write to assignedport.json
        fs.writeFileSync(portFilePath, JSON.stringify(assignedPorts, null, 2));
    }

    let o_port = o_assignedPorts[token];
    if (!o_port) {
        // Find a random port that's not already assigned
        const availablePorts = Array.from({ length: o_portCount }, (_, i) => i + o_portRange)
            .filter(p => !Object.values(o_assignedPorts).includes(p));

        if (availablePorts.length === 0) {
            return res.json({ code: -1, port: null, outlineport:null });
        }

        o_port = availablePorts[Math.floor(Math.random() * availablePorts.length)];
        o_assignedPorts[token] = o_port;

        // Write to assignedport.json
        fs.writeFileSync(o_portFilePath, JSON.stringify(o_assignedPorts, null, 2));
    }

    res.json({ code: 1, port: port, outlineport: o_port });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



// Function to check and create file with empty JSON object
function checkAndCreateFile(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '{}', 'utf8');
        console.log(`Created file: ${filePath}`);
    } else {
        console.log(`File already exists: ${filePath}`);
    }
}

// Check and create files
checkAndCreateFile(userFilePath);
checkAndCreateFile(portFilePath);
checkAndCreateFile(o_portFilePath);