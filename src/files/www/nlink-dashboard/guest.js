var guestWifiEnable = document.getElementById('guest-wifi-enable');
var guestWifiEnableLabel = document.getElementById('guest-wifi-enable-label');
var guestSsid = document.getElementById('guest-ssid');
var guestPassword = document.getElementById('guest-password');
var guestUpdate = document.getElementById('guest-update');
var userManagement = document.getElementById('user-management');
const otherParts = document.getElementById('other-parts')
const connectedDevice = document.getElementById('guest-connected-devices')
const totalSend = document.getElementById('guest-connected-total-send')
const totalReceive = document.getElementById('guest-connected-total-receive')
const connectedClientsList = document.getElementById('connected-clients-list');

function validateSSID(ssid) {
    // Allowed characters: alphanumeric, space, and special characters ! . _ - ()
    const ssidRegex = /^[a-zA-Z0-9 !._\-()]+$/;
    return ssidRegex.test(ssid);
}

function validatePassword(password) {
    // Allowed characters: any printable ASCII character
    const passwordRegex = /^[\x20-\x7E]+$/; // ASCII range for printable characters (space to ~)
    return passwordRegex.test(password);
}

guestUpdate.onclick = async function(e){
    var newSSID = guestSsid.value;
    var newPASS = guestPassword.value;
    if( !validateSSID(newSSID) ){
        addCustomAlert("Error!","SSID has not acceptable charachter")
        return
    }
    if( !validatePassword(newPASS) ){
        addCustomAlert("Error!","Password has not acceptable charachter")
        return
    }
    loading(true,"Set Guest Wifi Info")
    await async_lua_call("dragon.sh","guest-set "+newSSID+" "+newPASS)
    await wifiInfo()
}

function updateTable(count,send,receive) {
    connectedDevice.textContent = count;
    totalSend.textContent = send
    totalReceive.textContent = receive 
}

function addConnectedClient(mac,total) {
    
    var tr = document.createElement('tr');
    var td1 = document.createElement('td');
    td1.textContent = mac;
    var td2 = document.createElement('td');
    td2.textContent = parseInt(total);
    
    tr.append(td1, td2);
    connectedClientsList.append(tr); 
}
function clearClient(){
    connectedClientsList.innerHTML='';
}


guestWifiEnable.onclick = async function(e){
    
    setStatus(guestWifiEnable.checked)
    if(guestWifiEnable.checked){
        loading(true,"Enabling Guest wifi")
        await async_lua_call("dragon.sh","guest-on")
        await wifiInfo();
    }else{
        loading(true,"Disabling Guest wifi")
        await async_lua_call("dragon.sh","guest-off")
        await wifiInfo();
    }

}
function setStatus(status) {
    if(status){
        guestWifiEnableLabel.textContent = "Enable";
        guestWifiEnable.checked = true;
        otherParts.classList.add('d-block');
        otherParts.classList.remove('d-none');
    }else{
        guestWifiEnableLabel.textContent = "Disable";
        guestWifiEnable.checked = false;
        otherParts.classList.remove('d-block');
        otherParts.classList.add('d-none');
    }
}

userManagement.onclick = function(e){
    window.location.href = './management.html';
}

//netdump();
function netdump(){
    loading(true)
    const NET_DUMP=["network.interface","dump",{}]
    wanInterface="";
    ubus_call(NET_DUMP,function(chunk){
        if(chunk[0]==0){
            
            InterfaceInfo=chunk[1].interface;
            InterfaceInfo.forEach(element => {
                if (element.interface == "wwan") {
                    wanInterface=element 
                    console.log(element);
                } 
            });
        }
        if(wanInterface.up ){
            console.log("wanInterface")
            changeStatus(wanInterface.up,wanInterface['ipv4-address'][0].address)
        }

        loading(false)
        
    });
}

wifiInfo()
async function wifiInfo(){
    loading(true)
    const WIFI_INFO=["uci", "get", {"config":"wireless"}];
    var info = await async_ubus_call(WIFI_INFO);
    var device_wifi_info  = info[1].values
    var guest_wifi_2g = device_wifi_info["guest_2g"]

    if(guest_wifi_2g && guest_wifi_2g.disabled == "0"){
        setStatus(true);
        guestSsid.value = removeSubstring(guest_wifi_2g["ssid"],"-2g")
        guestPassword.value =  guest_wifi_2g["key"]
        loading(false)
        return
    }

    var guest_wifi_5g = device_wifi_info["guest_5g"]
    if(guest_wifi_5g && guest_wifi_5g.disabled == "0"){
        setStatus(true);
        guestSsid.value = removeSubstring(guest_wifi_5g["ssid"],"-5g")
        guestPassword.value =  guest_wifi_5g["key"]
        loading(false)
        return
    }

    setStatus(false);
    loading(false)
    return 
}

function addCustomAlert(title, message) {
    const alertContainer = document.getElementById('alertContainer');

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning alert-dismissible fade show';
    alertDiv.role = 'alert';

    const strongText = document.createElement('strong');
    strongText.innerText = title;

    const alertMessage = document.createTextNode(' ' + message);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');

    alertDiv.appendChild(strongText);
    alertDiv.appendChild(alertMessage);
    alertDiv.appendChild(closeButton);

    alertContainer.appendChild(alertDiv);
}


async function guestClient() {
    const GUEST_CLIENT=["hostapd.wlanguest_2g","get_clients",{}];
    const GUEST_CLIENT_5=["hostapd.wlanguest_5g","get_clients",{}];
    var chunk = await async_ubus_call(GUEST_CLIENT);
    var clients = chunk[1]?.clients;
    chunk = await async_ubus_call(GUEST_CLIENT_5)
    var clients_5g = chunk[1]?.clients;

    var totalSend = 0;
    var totalReceive = 0;
    var totalClients = 0;
    clearClient();
    for (var [key, value] of Object.entries(clients)) {
        var sendBytes = value.bytes.rx
        var reseiveBytes = value.bytes.tx
        totalSend += sendBytes;
        totalReceive += reseiveBytes;
        totalClients++;
        addConnectedClient(key,parseInt((reseiveBytes + sendBytes) / (1024 * 1024)))
    }
    for (var [key, value] of Object.entries(clients_5g)) {
        var sendBytes = value.bytes.rx
        var reseiveBytes = value.bytes.tx
        totalSend += sendBytes;
        totalReceive += reseiveBytes;
        totalClients++;
        addConnectedClient(key,parseInt((reseiveBytes + sendBytes) / (1024 * 1024)))
    }
    updateTable(totalClients,parseInt(totalSend / (1024 * 1024)) + ' MB', parseInt(totalReceive / (1024 * 1024)) + ' MB')
            //document.getElementById('guest-connected-total-send').textContent = parseInt(totalSend / (1024 * 1024)) + ' MB';
            //document.getElementById('guest-connected-total-receive').textContent = parseInt(totalReceive / (1024 * 1024)) + ' MB';
            // text_deviceID.value=deviceInfo["remote"]["key"];
            // input_admin_pass.value=deviceInfo["device_admin"]["key"];
        
}
setInterval(() => {
    guestClient()
}, 6000);