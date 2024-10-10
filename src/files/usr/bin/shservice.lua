#!/usr/bin/lua

local ubus = require("ubus")

-- Connect to UBus
local conn = ubus.connect()
if not conn then
    error("Failed to connect to ubus")
end

-- Define the function to run shell commands
local function run_command(req, msg)
    local command = msg.command
    if not command then
        conn:reply(req, { message = "No command provided" })
        return
    end

    -- Run the command in the background
    os.execute(command .. " &")

    -- Respond immediately with "done"
    conn:reply(req, { message = "done" })
end

-- Define the UBus methods
local methods = {
    run = {
        run_command, { command = ubus.STRING }
    }
}

-- Register the UBus object
conn:add({ shservice = methods })

-- Main loop to keep the script running
print("Service is running. Press Ctrl+C to stop.")
while true do
    -- Sleep for a short period to avoid busy-waiting
    os.execute("sleep 1")
end

-- Cleanup (though we won't actually reach here in this loop)
conn:close()
