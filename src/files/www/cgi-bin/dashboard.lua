#!/usr/bin/lua

function handle_request(env)
   

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


    local path = tostring(env.REQUEST_URI)
    -- Remove query string and hashtag from the path
    path = path:gsub("%?.*$", ""):gsub("#.*$", "")
    
    -- Extract everything after /dashboard/ instead of just the last segment
    local relative_path = path:match("/dashboard/(.*)$") or ""
    local file_path = "/www/dashboard/" .. (relative_path ~= "" and relative_path or "index.html")

    -- Get file extension for content type (using cleaned path)
    local ext = path:match("%.([^%.]+)$")
    local content_type = content_types[ext] or "text/html"

   -- Try to open and read the file
   local file = io.open(file_path, "r")
   if file then
       -- Output headers
       print("Status: 200 OK")
       print("Content-Type: " .. content_type)
       print("Cache-Control: no-store, no-cache, must-revalidate, max-age=0")
       print("Pragma: no-cache")
       print("Expires: 0")
       print("")
       
       -- Read and output file content
       local content = file:read("*all")
       file:close()
       print(content)
   else
       -- File not found - return 404
       print("Status: 404 Not Found")
       print("Content-Type: text/html")
       print("Cache-Control: no-store, no-cache, must-revalidate, max-age=0")
       print("Pragma: no-cache")
       print("Expires: 0")
       print("")
       print("<html><body><h1>404 - File not found</h1></body></html>")
   end
end
