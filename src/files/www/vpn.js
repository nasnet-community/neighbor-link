const configPart = document.getElementById("config-part")
const getConfig = document.getElementById("get-config")
const changeConfig = document.getElementById("change-config")
const configStatus = document.getElementById("config-status")
const vpnPart = document.getElementById("vpn-part")
const vpnOn = document.getElementById("vpn-on")
const vpnOff = document.getElementById("vpn-off")
const vpnStauts = document.getElementById("connection-status")
const vpnShield = document.getElementById("vpn-shield")
const ipAddress = document.getElementById("ip-address")
const ipCountry = document.getElementById("ip-country")
const internetProvider = document.getElementById("internet-provider")

function changeVPNstatus(status) {
    if (status == "connect") {
        vpnShield.setAttribute ('fill' ,'blue')
        vpnStauts.textContent = "Connected"
        vpnOn.checked=true
    }
    if (status == "disconnect") {
        vpnShield.setAttribute ('fill' ,'red')
        vpnStauts.textContent = "Disconnected"
        vpnOff.checked=true
    }
    if (status == "connecting") {
        vpnShield.setAttribute ('fill' ,'yellow')
        vpnStauts.textContent = "Connecting..."
        vpnOff.checked=true
    }
    
}
function setIpInfo(ip,country,provider) {
    ipAddress.textContent=ip
    internetProvider.textContent=provider    
    ipCountry.textContent=country
}

function configView(hasconfig){
    if(hasconfig){
        configPart.classList.add("d-none")
        configPart.classList.remove("d-flex")

        vpnPart.classList.add("d-flex")
        vpnPart.classList.remove("d-none")
    }
    else{
        configPart.classList.add("d-flex")
        configPart.classList.remove("d-none")

        vpnPart.classList.add("d-none")
        vpnPart.classList.remove("d-flex")
    }
}

getConfig.onclick=async function(){
    loading(true,"Parse & Save config ...")
    parseConfig();
    const VPN_SCR=["file","exec",{"command":"wg_scripts.sh","params":[ "get" ]}];
    configStatus.textContent = "Download Config ..."
    const response = await async_ubus_call(VPN_SCR)
    const stdout = response[1].stdout;
    if(stdout.includes("__GET_DONE__")){
        configView(true)
    }
    else if(stdout.includes("__Error__")){   
        configStatus.textContent = "Something Went wrong, please check you internet and try agaign"
    }
    loading(false)
}

changeConfig.onclick=async function(){
    loading(true, "Removing the config ...")
    const VPN_SCR=["file","exec",{"command":"wg_scripts.sh","params":[ "del" ]}];
    const response = await async_ubus_call(VPN_SCR)
    const stdout = response[1].stdout;
    if(stdout.includes("Deleted")){
        configView(false);
        await async_lua_call("dragon.sh","vpn-off")
        readVpnStatus()
    }
    else if(stdout.includes("__Error__")){   
        configStatus.textContent = "Something Went wrong, please check you internet and try agaign"
    }
    loading(false)
}

vpnOn.onclick=async function(){
    loading(true,"Connecting to the VPN")
    var vpn=await async_lua_call("dragon.sh","vpn-on")
    console.log(vpn)
    readVpnStatus()
}
vpnOff.onclick=async function(){
    loading(true,"Disconnecting from the VPN, Your starlink ip will not be transparent")
    var vpn=await async_lua_call("dragon.sh","vpn-off")
    console.log(vpn)
    readVpnStatus()
}

netdump();
function netdump(){
    loading(true)
    const NET_DUMP=["network.interface","dump",{}]
    wanInterface="";
    ubus_call(NET_DUMP,function(chunk){
        if(chunk[0]==0){
            
            InterfaceInfo=chunk[1].interface;
            InterfaceInfo.forEach(element => {
                if (element.interface == "wg0") {
                    wanInterface=element 
                    console.log(element);
                } 
            });
        }
        if(wanInterface.up == false ){
            console.log("wanInterface")
            //changeStatus(wanInterface.up,wanInterface['ipv4-address'][0].address)
        }

        loading(false)
        
    });
}

async function ipapi(){
    //var jsonString= await async_lua_call("dragon.sh","ip-api")
    //var unescapedString = jsonString.replace(/\\"/g, '"');
    //var jsonObject = JSON.parse(unescapedString);
    //setIpInfo(jsonObject["query"],jsonObject["country"],jsonObject["isp"])
    var jsonString= await async_ipapi_call()
    setIpInfo(jsonString["query"],jsonString["country"],jsonString["isp"])
    return jsonString
}



readVpnStatus()
async function  readVpnStatus(){
    loading(true,"Getting vpn status")
    const VPN_STAT=["file","exec",{"command":"wg_scripts.sh","params":[ "status" ]}];
    var response=await async_ubus_call(VPN_STAT)
    configView(true)
    // Extract the 'stdout' from the response
    const stdout = response[1].stdout;
    // Check if 'Connected' is present in the 'stdout'
    if (stdout.includes('__Connected__')) {
        changeVPNstatus("connect")
    } else if (stdout.includes('__Disconnected__')) {
        changeVPNstatus("disconnect")
    } else if (stdout.includes('__Error__')) {
        changeVPNstatus("connecting")
    }else if (stdout.includes('__No-Config__')) {
        configView(false)
    }else {
        changeVPNstatus("connecting")
    }
    await ipapi()
    loading(false)
}

function parseConfig() {
    const textarea = document.getElementById('wireguard-config');
    const configText = textarea.value;
    
    const lines = configText.trim().split('\n');
    const configObject = {};
    
    let currentSection = null;

    lines.forEach(line => {
        line = line.trim();
        
        if(line.startsWith('#')){
            // the line is command
            console.log(line);
        } 
        else if(line.startsWith('[') && line.endsWith(']')) {
            // New section
            currentSection = line.slice(1, -1).trim();
            configObject[currentSection] = {};
        } else if (line.includes('=')) {
            // Key-value pair with improved handling for '=' in values
            const indexOfEqual = line.indexOf('=');
            const key = line.substring(0, indexOfEqual).trim();
            const value = line.substring(indexOfEqual + 1).trim();

            if (currentSection) {
                configObject[currentSection][key] = value;
            } else {
                configObject[key] = value;
            }
        }
    });

    setWireguardConfig(configObject);
    console.log( configObject );
    console.log( btoa(JSON.stringify(configObject) ) );
}

async function setWireguardConfig(config){
    const VPN_CONFIG=["file","exec",{"command":"dragon.sh","params":[ "wireguard-set-conf", btoa(JSON.stringify(config) ) ]}];
    res = await async_ubus_call(VPN_CONFIG)
}