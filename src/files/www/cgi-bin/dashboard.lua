#!/usr/bin/lua

function handle_request(env)
    print("Status: 200 OK")
    print("Content-Type: text/html")
    print("")


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

    local sanitized_uri = env.REQUEST_URI:gsub("%.%.", ""):gsub("//", "/")
    local file_path = "/www/nlink-dashboard" .. (sanitized_uri or "/index.html")

    local path = tostring(env.REQUEST_URI)
    -- Extract the file name from the path
    local filename = path:match("([^/]+)$")


    -- Get file extension from REQUEST_URI
    local ext = env.REQUEST_URI:match("%.([^%.]+)$") or "html"
    local content_type = content_types[ext:lower()] or "text/plain"

    -- Output in HTML format
    print("<html><body>")
    print("<p>Hello World -> " .. tostring(env.REQUEST_URI) .. "</p>")
    print("<p>ext = " .. ext .. "</p>")
    print("<p>filename = " .. filename .. "</p>")
    print("</body></html>")
end
