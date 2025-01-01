#!/usr/bin/lua


-- Add at the top of the file
local function test_run()
    print("Testing handle_request function")
    
    -- Mock uhttpd if it doesn't exist
    if not uhttpd then
        uhttpd = {
            send = function(msg)
                print("MOCK SEND:", msg)
            end
        }
    end
    
    -- Mock environment table
    local test_env = {
        REQUEST_URI = "/index.html",
        SERVER_NAME = "localhost",
        -- Add other environment variables as needed
    }
    
    -- Run the handler
    handle_request(test_env)
end

-- Add near the top of your file
local function log_debug(msg)
    local f = io.open("/tmp/ui_debug.log", "a")
    if f then
        f:write(os.date("%Y-%m-%d %H:%M:%S ") .. tostring(msg) .. "\n")
        f:close()
    end
end

-- Custom handler for setting headers
function handle_request(env)
    log_debug("Request started")
    
    -- Add input validation
    if not env or not env.REQUEST_URI then
        print("HTTP/1.1 400 Bad Request\r\n\r\n")
        print("Invalid request")
        return
    end
    
    log_debug("REQUEST_URI: " .. tostring(env.REQUEST_URI))
    
    -- Define content types for different file extensions
    local content_types = {
        html = "text/html",
        css = "text/css",
        js = "application/javascript",
        json = "application/json",
        png = "image/png",
        jpg = "image/jpeg",
        jpeg = "image/jpeg",
        gif = "image/gif"
    }

    -- Get file extension from REQUEST_URI
    local ext = env.REQUEST_URI:match("%.([^%.]+)$") or "html"
    local content_type = content_types[ext:lower()] or "text/plain"

    -- Sanitize file path to prevent directory traversal
    local sanitized_uri = env.REQUEST_URI:gsub("%.%.", ""):gsub("//", "/")
    local file_path = "/www/nlink-dashboard" .. (sanitized_uri or "/index.html")
    
    local file = io.open(file_path, "r")
    if file then
        local success, content = pcall(function() return file:read("*all") end)
        file:close()
        
        if success then
            -- Set headers with no-cache directives
            print("HTTP/1.1 200 OK\r\n")
            print("Content-Type: " .. content_type .. "\r\n")
            print("Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n")
            print("Pragma: no-cache\r\n")
            print("Expires: 0\r\n")
            print("\r\n")
            print(content)
        else
            print("HTTP/1.1 500 Internal Server Error\r\n\r\n")
            print("Error reading file")
            log_debug("Error reading file: " .. file_path)
        end
    else
        print("HTTP/1.1 404 Not Found\r\n\r\n")
        print("File not found: " .. file_path)
        log_debug("File not found: " .. file_path)
    end
    
end

-- If running directly (not through uhttpd), run the test
if not uhttpd or os.getenv("TEST_MODE") then
    test_run()
end

return handle_request