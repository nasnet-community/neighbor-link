#!/usr/bin/lua

-- Function to parse the query string without urllib
function parse_query_string(query)
    local params = {}
    for k, v in string.gmatch(query, "([^&=?]+)=([^&=?]+)") do
        params[k] = v
    end
    return params
end

-- Function to serialize a table (stringify)
function table_to_string(tbl, indent)
    local str = ""
    local indent = indent or ""

    for k, v in pairs(tbl) do
        str = str .. indent .. tostring(k) .. ": "

        if type(v) == "table" then
            str = str .. "\n" .. table_to_string(v, indent .. "  ")
        else
            str = str .. tostring(v) .. "\n"
        end
    end

    return str
end

-- Function to log data to a file
function log_to_file(data)
    local file = io.open("/www/portal/env_log.txt", "a")  -- Open the file in append mode
    if file then
        file:write(data .. "\n")  -- Write the data to the file
        file:close()              -- Close the file
    else
        print("Error opening file for logging")
    end
end

-- Define the handle_request function required by uhttpd
function handle_request(env)
    -- Log the entire env table to the file
    local env_string = table_to_string(env)
    log_to_file(env_string)  -- Log the environment variables to a file

    -- Get the query string from the environment variable
    local query_string = env.QUERY_STRING or ""
    local params = parse_query_string(query_string)

    -- Retrieve username and password from query parameters
    local username = params["username"] or ""
    local password = params["password"] or ""

    -- Get the client's IP address
    local client_ip = env.REMOTE_ADDR or ""

    -- Example command to get MAC address (if needed)
    -- local client_mac = "" -- You can retrieve MAC using ARP or similar methods

    -- Prepare the command to execute binauth.sh
    local command = string.format("/usr/bin/binauth.sh %s %s %s", username, password, client_ip)

    -- Execute the command
    local handle = io.popen(command)
    local result = handle:read("*a")
    local success = handle:close()
    
    -- Redirect based on the result of the command
    if string.find(result, "_SUCCESS_") then
        -- Redirect to /success
        print("Status: 302 Found")
        print("Location: /success.html")
        print() -- End of headers
    else
        -- Redirect to /failed
        print("Status: 302 Found")
        print("Location: /failed.html")
        print() -- End of headers
    end
end
