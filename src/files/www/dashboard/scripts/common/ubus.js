var ubus_call_id = 0;
var token=localStorage.getItem("routro_token");

function ubus_call(params,cb){

    ubus_call_id++;
    var body={
        "jsonrpc": "2.0",
        "id": ubus_call_id,
        "method": "call",
        "params":[
            token
        ]
    }
    for (param of params){
        body["params"].push(param);
    }

    // create XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://192.168.151.1/ubus");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(body));

    xhr.onload = function() {
        if (xhr.status === 200) {
            //parse JSON datax`x
            var resBody = JSON.parse(xhr.responseText);

            if (resBody["result"]){
                cb(resBody["result"]);
            }
            
            else{
                //console.log(resBody)
                if(resBody["error"]?.["code"] == -32002 || resBody["error"]?.["code"] == -37200 ){
                    window.location.href = "index.html";
                }
            }
            
        } 
        else {
          console.log("XHR was failed")
        }
    }
    xhr.onerror = function() {
        loading(false);
        console.log("Network error occurred")
        cb([-1])
    }
}

async function async_ubus_call(ubus_command){
    return new Promise((resolve,reject) =>{
        try {
            ubus_call(ubus_command, function(chunk) {
                resolve(chunk);
            })
        } catch (error) {
            reject(error);
        }
    })
}


function lua_call(command, params, cb) {

    // URL-encode the body
    const urlEncodedBody = `cmd=${encodeURIComponent(command)}&params=${encodeURIComponent(params)}`;

    // create XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://192.168.151.1/cgi-bin/api");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(urlEncodedBody);

    xhr.onload = function() {
        if (xhr.status === 200) {
            // Extract the text between <___RESPONSE___> and <___END___>
            const responseText = xhr.responseText;
            const startTag = "<___RESPONSE___>";
            const endTag = "<___END___>";
            const startIndex = responseText.indexOf(startTag);
            const endIndex = responseText.indexOf(endTag);

            if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                const extractedText = responseText.substring(startIndex + startTag.length, endIndex);
                cb(extractedText.trim());
            } else {
                cb("error");
            }
        } else {
            console.log("XHR failed with status: " + xhr.status);
            cb("error");
        }
    }

    xhr.onerror = function() {
        console.log("Network error occurred");
        cb("error");
    }
}

async function async_lua_call(cmd,params){
    return new Promise((resolve,reject) =>{
        try {
            lua_call(cmd,params, function(chunk) {
                resolve(chunk);
            })
        } catch (error) {
            reject(error);
        }
    })
}

function ipapi_call(cb) {

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://ip-api.com/json");
    xhr.send();

    xhr.onload = function() {
        if (xhr.status === 200) {
            var resBody = JSON.parse(xhr.responseText);
            cb(resBody)
        } else {
            cb("error");
        }
    }

    xhr.onerror = function() {
        cb("error");
    }
}

async function async_ipapi_call(){
    return new Promise((resolve,reject) =>{
        try {
            ipapi_call(function(chunk) {
                resolve(chunk);
            })
        } catch (error) {
            reject(error);
        }
    })
}