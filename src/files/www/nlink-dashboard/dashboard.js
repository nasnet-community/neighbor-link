// const vpnOn = document.getElementById("vpn-on")
// const vpnOff = document.getElementById("vpn-off")
const vpnStauts = document.getElementById("connection-status")
const vpnShield = document.getElementById("vpn-shield")
const ipAddress = document.getElementById("ip-address")
const internetProvider = document.getElementById("internet-provider")

const btnStarlink = document.getElementById('starlink-btn')
const btnIran = document.getElementById('iran-btn')
const btnSettings = document.getElementById('settings-btn')
const btnVPN = document.getElementById('vpn-btn')
const btnGuest = document.getElementById('guest-btn')
const btnReach = document.getElementById('reach-btn')
const btnFrimware = document.getElementById('frimware-btn')

btnStarlink.onclick=function (e){
    window.location.href = "wifi.html?ref=dashboard";
}
btnIran.onclick=function (e){
    window.location.href = "ethernet.html?ref=dashboard";
}
btnSettings.onclick=function (e){
    window.location.href = "settings.html?ref=dashboard";
}
btnVPN.onclick=function (e){
    window.location.href = "vpn.html?ref=dashboard";
}
btnGuest.onclick=function (e){
    window.location.href = "guest.html?ref=dashboard";
}
btnReach.onclick=function (e){
    window.location.href = "infinite_reach.html?ref=dashboard";
}
btnFrimware.onclick=function (e){
    window.location.href = "firmware.html?ref=dashboard";
}


// document.addEventListener("DOMContentLoaded", function() {
//     // Expected values
//     const expectedDashboardSeen = "true";
//     // Retrieve values from localStorage
//     const dashboardSeen = localStorage.getItem("opr-dashboard-seen");

//     // Check if the values match the expected values
//     if (dashboardSeen !== expectedDashboardSeen ) {
//         // Redirect to the desired page if values do not match
//         window.location.href = "wifi.html";
//     }
// });



function changeVPNstatus(status) {
    if (status == "connect") {
        vpnShield.setAttribute ('fill' ,'blue')
        vpnStauts.textContent = "Connected"
        //vpnOn.checked=true
    }
    if (status == "disconnect") {
        vpnShield.setAttribute ('fill' ,'red')
        vpnStauts.textContent = "Disconnected"
        //vpnOff.checked=true
    }
    if (status == "connecting") {
        vpnShield.setAttribute ('fill' ,'yellow')
        vpnStauts.textContent = "Connecting..."
        //vpnOff.checked=true
    }
    
}
function setIpInfo(ip,provider) {
    ipAddress.textContent=ip
    internetProvider.textContent=provider    
}

function updateStarlink(status) {
    if (status == "connect") {
        btnStarlink.classList.add('btn-success')
        btnStarlink.classList.remove('btn-danger')
    }
    if (status == "disconnect") {
        btnStarlink.classList.add('btn-danger')
        btnStarlink.classList.remove('btn-success')
    }
}
function updateIran(status) {
    if (status == "connect") {
        btnIran.classList.add('btn-success')
        btnIran.classList.remove('btn-danger')
    }
    if (status == "disconnect") {
        btnIran.classList.add('btn-danger')
        btnIran.classList.remove('btn-success')
    }
}
function updateGuest(status) {
    if (status == "enable") {
        btnGuest.classList.add('btn-success')
        btnGuest.classList.remove('btn-danger')
    }
    if (status == "disable") {
        btnGuest.classList.add('btn-danger')
        btnGuest.classList.remove('btn-success')
    }
}

function updateReach(status) {
    if (status == "disconnect") {
        btnReach.classList.add('btn-danger')
        btnReach.classList.remove('btn-suncess')
        btnReach.classList.remove('btn-warning')
    }
    if (status == "disable") {
        btnReach.classList.add('btn-warning')
        btnReach.classList.remove('btn-success')
        btnReach.classList.remove('btn-danger')
    }
    if (status == "enable") {
        btnReach.classList.add('btn-success')
        btnReach.classList.remove('btn-danger')
        btnReach.classList.remove('btn-warning')
    }
}

function updateVpn(status) {
    if (status == "disconnected") {
        btnVPN.classList.add('btn-danger')
        btnVPN.classList.remove('btn-suncess')
        btnVPN.classList.remove('btn-warning')
    }
    if (status == "noconfig") {
        btnVPN.classList.add('btn-warning')
        btnVPN.classList.remove('btn-success')
        btnVPN.classList.remove('btn-danger')
    }
    if (status == "connected") {
        btnVPN.classList.add('btn-success')
        btnVPN.classList.remove('btn-danger')
        btnVPN.classList.remove('btn-warning')
    }
}

// vpnOn.onclick=async function(){
//     loading(true,"Connecting to the VPN")
//     var vpn=await async_lua_call("dragon.sh","vpn-on")
//     console.log(vpn)
//     readVpnStatus()
// }
// vpnOff.onclick=async function(){
//     loading(true,"Disconnecting from the VPN, Your starlink ip will not be transparent")
//     var vpn=await async_lua_call("dragon.sh","vpn-off")
//     console.log(vpn)
//     readVpnStatus()
// }

async function ipapi(){
    //var jsonString= await async_lua_call("dragon.sh","ip-api")
    //var unescapedString = jsonString.replace(/\\"/g, '"');
    //var jsonObject = JSON.parse(unescapedString);
    //setIpInfo(jsonObject["query"],jsonObject["country"],jsonObject["isp"])
    var jsonString= await async_ipapi_call()
    setIpInfo(jsonString["query"],jsonString["isp"])
    return jsonString
}



readVpnStatus()
async function  readVpnStatus(){
    loading(true,"Getting vpn status")
    const VPN_STAT=["file","exec",{"command":"wg_scripts.sh","params":[ "status" ]}];
    var response=await async_ubus_call(VPN_STAT)
    // Extract the 'stdout' from the response
    const stdout = response[1].stdout;
    // Check if 'Connected' is present in the 'stdout'
    if (stdout.includes('__Connected__')) {
        changeVPNstatus("connect")
        updateVpn("connected")

    } else if (stdout.includes('__Disconnected__')) {
        changeVPNstatus("disconnect")
        updateVpn("disconnected")
    } else if (stdout.includes('__Error__')) {
        changeVPNstatus("connecting")
        updateVpn("noconfig")
    }else if (stdout.includes('__No-Config__')) {
        changeVPNstatus("disconnect")
        updateVpn("noconfig")
    }else {
        changeVPNstatus("connecting")
        updateVpn("disconnected")
    }
    await ipapi()
    loading(false)
}
netdump()
function netdump(){
    loading(true)
    const NET_DUMP=["network.interface","dump",{}]
    wanInterface="";
    ubus_call(NET_DUMP,function(chunk){
        if(chunk[0]==0){
            
            InterfaceInfo=chunk[1].interface;
            InterfaceInfo.forEach(element => {
                if (element.interface == "wwan") {
                    if(element.up){
                        updateStarlink("connect")
                    }else{
                        updateStarlink("disconnect")
                    }
                } 
                if (element.interface == "wan") {
                    if(element.up){
                        updateIran("connect")
                    }else{
                        updateIran("disconnect")
                    }
                }
                if (element.interface == "Guest") {
                    if(element.up){
                        updateGuest("enable")
                    }else{
                        updateGuest("disable")
                    }
                }   
            });
        }
        loading(false)
    });
}

getConfig();
async function getConfig(){
    var rawConfig = await async_lua_call("dragon.sh","infinite-reach-status")
    var splitedConfig = rawConfig.split(" ")
    if( splitedConfig[2] == "running" && splitedConfig[3]== "Connected"){
        updateReach("enable")
    }else{
        updateReach("disable")
    }
}