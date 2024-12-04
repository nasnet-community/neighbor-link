var guestSsid = document.getElementById('wifi-ssid');
var guestPassword = document.getElementById('wifi-password');
var guestUpdate = document.getElementById('wifi-update');


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
        addCustomAlert("Error!","SSID has not acceptable charachter",5000)
        return
    }
    if( !validatePassword(newPASS) ){
        addCustomAlert("Error!","Password has not acceptable charachter",5000)
        return
    }
    if( newPASS.length < 8 ){
        addCustomAlert("Error!","Password must be at leaset 8 charachters",5000)
        return
    }

    loading(true,"Set Wifi Info")
    await async_lua_call("dragon.sh","wifi-set "+newSSID+" "+newPASS)
    await wifiInfo()
}


wifiInfo()
async function wifiInfo(){
    loading(true)
    const WIFI_INFO=["uci", "get", {"config":"wireless"}];
    var info = await async_ubus_call(WIFI_INFO);
    var device_wifi_info  = info[1].values
    var guest_wifi_2g = device_wifi_info["default_radio1"]

    if(guest_wifi_2g && guest_wifi_2g.disabled == "0"){
        guestSsid.value = removeSubstring(guest_wifi_2g["ssid"],"-2g")
        guestPassword.value =  guest_wifi_2g["key"]
        loading(false)
        return
    }

    var guest_wifi_5g = device_wifi_info["default_radio0"]
    if(guest_wifi_5g && guest_wifi_5g.disabled == "0"){
        guestSsid.value = removeSubstring(guest_wifi_5g["ssid"],"-5g")
        guestPassword.value =  guest_wifi_5g["key"]
        loading(false)
        return
    }

    loading(false)
    return 
}