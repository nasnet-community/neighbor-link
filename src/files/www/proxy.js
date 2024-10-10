
iHost = document.getElementById("i-host")
iPort = document.getElementById("i-port")
iUsername = document.getElementById("i-username")
iPassword = document.getElementById("i-password")

function updateTable(user,pass,host,port) {
    iHost.textContent = host;
    iPort.textContent = port
    iUsername.textContent = user 
    iPassword.textContent = pass 
}

getProxyConfig();
async function getProxyConfig(){
    loading(true,"Getting info...")
    var rawConfig = await async_lua_call("dragon.sh","ireach-proxy-get")
    var status=rawConfig.split(' ')[0]
    if( status == "running"){
        //setStatus(true);
        var [state,isdomain,user,pass,host,port] = rawConfig.split(' ');
        var proxyHost="https://"+host;
        if( isdomain != "domain" ){
            proxyHost="http://"+host;
        }
        updateTable(user,pass,proxyHost,port)
    }else{
        updateTable("no-Config","no-Config","no-Config","no-Config")
        //setStatus(false);
    }
    loading(false);
}
