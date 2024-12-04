
infoSection = document.getElementById("info-section")
iHost = document.getElementById("i-host")
iPort = document.getElementById("i-port")
iUsername = document.getElementById("i-username")
iPassword = document.getElementById("i-password")
regenButton = document.getElementById("regen-pass")

function updateTable(user,pass,host,port) {
    iHost.textContent = host;
    iPort.textContent = port
    iUsername.textContent = user 
    iPassword.textContent = pass 
}

function parseOutlineAccessKey(accessKey) {
    const regex = /^ss:\/\/[^@]+@([^:]+):(\d+)/;
    const match = accessKey.match(regex);
  
    if (!match) {
      return { error: 'Invalid access key format' };
    }
  
    const hash = accessKey.split("@")[0];
    const host = match[1];
    const port = match[2];
  
    const isIp = /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(host);
    const isDomain = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(host);
  
    if (!isIp && !isDomain) {
      return { error: 'Host is neither a valid IP address nor a domain' };
    }
  
    return {
      hash,
      host,
      port,
      type: isIp ? 'IP' : 'Domain',
    };
  }


const convertButton = document.getElementById("outline-convert")
const accessKey = document.getElementById("access-key")
const outlineOrigin = document.getElementById("outline-origin")
const outlineMap = document.getElementById("outline-map")
const convertedAccessKey = document.getElementById("out-access-key")


convertButton.onclick = async function(e){
  loading(true,"Connect & Convert ...")
    var parsedKey=parseOutlineAccessKey(accessKey.value)
    if(  parsedKey["error"] )
    {
        addCustomAlert("access-key is not valid",parsedKey["error"])
        loading(false)
        return;
    }
    var outlineServerIP=parsedKey["host"]
    if( parsedKey["type"] == "Domain" ){
        outlineServerIP=await domainToIP(parsedKey["host"])
        if (  outlineServerIP == null ){
            addCustomAlert("Invarlid outline server","The domain is not resolve to any ipv4")
            loading(false)
            return;
        }
    }
    
    var rawinfo = await async_lua_call("dragon.sh","ireach-outline-set "+outlineServerIP+" "+parsedKey["port"])
    var parsedInfo= rawinfo.split(" ")
    if( parsedInfo[0] != "running" ||  parsedInfo[1] != "Connected" ){
      addCustomAlert("Something went wrong","Please try again later",4000)
      loading(false)
      return
    }
    var convertedKeyString = parsedKey["hash"]+"@"+parsedInfo[2]+":"+parsedInfo[3];
    await async_lua_call("dragon.sh","ireach-outline-write "+btoa(convertedKeyString) )
    convertedAccessKey.textContent =  convertedKeyString+"/?outline=1#🚀 Free Internet"
    loading(false)
}

getOutline()
async function getOutline(){
  loading(true,"Getting info")
    var rawinfo = await async_lua_call("dragon.sh","ireach-outline-get")
    
    var [status, connection, savedKey] = rawinfo.split(' ');
    if (status != "running" || connection !="Connected" ) {
        outlineOrigin.textContent = "Service Is not running"
        outlineOrigin.classList.add("text-danger")
        outlineOrigin.classList.remove("text-success")
    }
    else{
        outlineOrigin.textContent = "Service is Running, Share the converted key with anyone you want"
        outlineOrigin.classList.add("text-success")
        outlineOrigin.classList.remove("text-danger")
        convertedAccessKey.textContent =  atob(savedKey)+"/?outline=1#🚀 Free Internet"
    }
    loading(false)
    return rawinfo.split(' ');
}


async function domainToIP(domain) {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const data = await response.json();
  
      if (data.Answer && data.Answer.length > 0) {
        return data.Answer[0].data;  // Returns the first A record (IPv4 address)
      } else {
        // Return null if no IP address is found
        return null;
      }
    } catch (error) {
      console.error("Error fetching IP:", error.message);
      return null; // Return null if there was an error during the fetch or parsing
    }
  }