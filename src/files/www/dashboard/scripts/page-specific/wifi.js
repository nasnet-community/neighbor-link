var connectionBand="2 or 5"
var connectionEncryption = "WPA3 WPA2 PSK"

function cloneAndUpdateWifiElement(ssid, band, security) {
    // Select the element to be cloned
    const originalElement = document.getElementById('wifi-element');
    
    // Clone the element
    const clonedElement = originalElement.cloneNode(true);
    
    // Update the SSID
    const ssidElement = clonedElement.getElementsByClassName('ssid-span')[0];
    ssidElement.textContent = ssid;
    
    // Update the band
    const bandElement = clonedElement.getElementsByClassName('band-span')[0];
    bandElement.textContent = band;
     
    // Update the band
    const encElement = clonedElement.getElementsByClassName('encryption-span')[0];
    encElement.textContent = security;
    
    // Update the security icon visibility
    const lockIcon = clonedElement.getElementsByClassName('wifi-lock-icon')[0];
    console.log(security)
    if (security == "none") {
        lockIcon.classList.add("d-none");
        console.log("none added")
    } 
    clonedElement.classList.remove("d-none");
    clonedElement.classList.add("d-flex")
    // Return the updated element
    return clonedElement;
}

const wifiContainer = document.getElementById('elements-container');
function clearElements() {
    wifiContainer.innerHTML = '';
}
function addWifiElement(SSiD,band,encryption){
    const newElement = cloneAndUpdateWifiElement(SSiD,band+" Ghz", encryption);
    newElement.onclick = () => wificlick(SSiD,band, encryption);
    wifiContainer.appendChild(newElement); // Append the new element to the body for demonstration
}
function wificlick(SSiD,band,encryption){
    connectionElement.classList.add("d-flex");
    connectionElement.classList.remove("d-none")
    passInput.value=""
    if(SSiD == "Hiden Network"){
        ssidPart.classList.add("d-block");
        ssidPart.classList.remove("d-none");
        ssidInput.value=""
    }
    else{
        ssidPart.classList.remove("d-block");
        ssidPart.classList.add("d-none");
        ssidInput.value=SSiD
    }
    connectionBand=band
    connectionEncryption=encryption;
}


const scanButton = document.getElementById("scan-wifi-btn")
scanButton.onclick=async function(){
    loading(true,"Scanning the Wi-Fi. This will take some time.")
    clearElements();
    for (let index = 0; index < 2; index++) {
        const WIFI_SCAN=["iwinfo", "scan", {"device":"radio"+index}];
        var wifi_scan_raw = await async_ubus_call(WIFI_SCAN);
        if( wifi_scan_raw[0] == 0 )
        {
            var available_wifi_list=wifi_scan_raw[1].results;
            for (var i = 0; i< available_wifi_list.length; i++){
                addWifiElement(available_wifi_list[i]["ssid"] || "Hiden Network", available_wifi_list[i]["band"] ,getEncryptionType( available_wifi_list[i] ))
            }
        }
    }
    loading(false)
}


const ssidInput = document.getElementById("connection-ssid");
const ssidPart = document.getElementById("ssid-part"); 
const passInput = document.getElementById("connection-password");
const cancelButton=document.getElementById("cancel");
const ConnectButton=document.getElementById("connect");
const connectionElement =  document.getElementById("connection-span")


cancelButton.onclick=function(){
    connectionElement.classList.remove("d-flex");
    connectionElement.classList.add("d-none");
}

async function check_wifi_status(){
    var status= await async_lua_call("dragon.sh", "iwstat "+connectionBand)
    return status
}
function checkWifiLoop() {
    let intervalId = setInterval(async () => {
        try {
            let status = await check_wifi_status();
            if (status === "Connected") {
                clearInterval(intervalId);
                console.log("Wi-Fi is connected.");
                changeStatus(true,ssidInput.value)
                connectionElement.classList.remove("d-flex");
                connectionElement.classList.add("d-none");
                clearElements();
                loading(false);
            }
            else if (status === "Disabled") {
                clearInterval(intervalId);
                console.log("Wi-Fi is disabled.");
                loading(false);
                addCustomAlert("Error!","The password might be incorrect.")
            } else {
                console.log("Checking Wi-Fi status...");
            }
        } catch (error) {
            console.error("Error checking Wi-Fi status:", error);
        }
    }, 5000); // 5000 milliseconds = 5 seconds
}
ConnectButton.onclick=function(){

    const ssid = ssidInput.value.trim();
    const password = passInput.value.trim();
    
    if (ssid === "" || password === "") {
        addCustomAlert("Error: ","SSID and Password cannot be empty");
        return;
    }
    if (password.length < 6 ) {
        addCustomAlert("Error: ","Password is too short");
        return;
    }
    var b64ssid=btoa(ssid)
    var b64pass=btoa(password)
    const param = "iwset " + b64ssid + " " + b64pass + " " + connectionBand + " " + connectionEncryption
    lua_call("dragon.sh", param,function(chunk){
        console.log(chunk);
        loading(false);
        if(chunk == "Done"){
            loading(true,"Establishing the connection will take about 20 seconds. If you were using Wi-Fi, you might be disconnected now.")
            checkWifiLoop()
        }
        else{
            addCustomAlert("Something Went Wrong!","Try again")
        }
        
    })

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

const connectionStatus =  document.getElementById("connection-status")
function changeStatus(theStatus,SSID) {
    const textBox = connectionStatus.getElementsByTagName("strong")[0]
    const ssidBox = connectionStatus.getElementsByTagName("strong")[1]
    if(theStatus){
        textBox.textContent = "Status: Connected"
        ssidBox.textContent = SSID
        connectionStatus.classList.remove("alert-danger");
        connectionStatus.classList.add("alert-success");
    }
    else{
        textBox.textContent = "Status: Disconnected"
        ssidBox.textContent = ""
        connectionStatus.classList.remove("alert-success");
        connectionStatus.classList.add("alert-danger");
    }
    
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

function getEncryptionType(accessPoint) {
    if (!accessPoint.encryption || !accessPoint.encryption.enabled) {
        return "none"; // No encryption
    }

    const wpaVersions = accessPoint.encryption.wpa || [];
    const authMethods = accessPoint.encryption.authentication || [];
    const ciphers = accessPoint.encryption.ciphers || [];

    // Check for WPA3 (SAE)
    if (wpaVersions.includes(3) && authMethods.includes("sae")) {
        if (wpaVersions.includes(2) && authMethods.includes("psk")) {
            return "sae-mixed"; // WPA3/WPA2 mixed mode
        }
        return "sae"; // WPA3 (SAE) only
    }

    // Check for WPA2-PSK
    if (wpaVersions.includes(2) && authMethods.includes("psk")) {
        if (ciphers.includes("ccmp")) {
            return "psk2"; // WPA2 with AES (CCMP)
        } else if (ciphers.includes("tkip")) {
            return "psk2-tkip"; // WPA2 with TKIP (less secure)
        }
    }

    // Check for WPA-PSK
    if (wpaVersions.includes(1) && authMethods.includes("psk")) {
        if (ciphers.includes("ccmp")) {
            return "psk"; // WPA with AES
        } else if (ciphers.includes("tkip")) {
            return "psk-tkip"; // WPA with TKIP
        }
    }

    // Check for WEP encryption
    if (authMethods.includes("wep")) {
        return "wep"; // WEP encryption
    }

    // Return "unknown" for any unrecognized encryption types
    return "unknown";
}