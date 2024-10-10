// Global Variables
var wifiApDevices=[];
var input_global_wifi_frq="2 or 5"
var has5G=false;
var wifiRadios=[]

//Const 

var copyBtn = document.getElementById('copy-device-id');
copyBtn.addEventListener('click', copyDeviceId);

function copyDeviceId() {
    var deviceId = document.getElementById('device-id-input').value;
    navigator.clipboard.writeText(deviceId);
    copyBtn.textContent = 'Copied!';
    copyBtn.setAttribute('disabled', 'disabled');
    setTimeout(function () {
        copyBtn.textContent = 'Copy';
        copyBtn.removeAttribute('disabled');
    }, 3000);
}


function showWifiElements(showing){

    var globalWifiElements = document.querySelectorAll('.internet-source-global-wifi');
    for (var i = 0; i < globalWifiElements.length; i++) {
        globalWifiElements[i].style.display = showing? 'block' : 'none' ;
    }

}


var globalWifiCTA = document.getElementById('internet-source-global-wifi-connect');
var globalReloadCTA = document.getElementById('internet-source-global-reload');

// notif handling
var notifElement = document.getElementById('notif');
var notifMessageContainer = document.getElementById('notif-message');
var closeNotif = document.getElementById('close-notif');
closeNotif.addEventListener('click', function() { notif(false); });

function notif(show, type, text) {
    if(show) {
        notifElement.removeAttribute('class');
        notifElement.classList.add("alert", "alert-"+type);
        notifMessageContainer.textContent = text;
        notifElement.style.display = "flex";
    } else {
        notifElement.style.display = "none";
    }
}

globalWifiCTA.onclick = function () {

    if( input_global_wifi_frq == 5 ){
        setDeviceWifiInfo(input_global_wifi_ssid.value, input_global_wifi_pass.value, "client_2g", "1");
        setDeviceWifiInfo(input_global_wifi_ssid.value, input_global_wifi_pass.value, "client_5g", "0",1);
    }
    else{
        setDeviceWifiInfo(input_global_wifi_ssid.value, input_global_wifi_pass.value, "client_5g", "1");
        setDeviceWifiInfo(input_global_wifi_ssid.value, input_global_wifi_pass.value, "client_2g", "0", 1 );
    }
};

// this tocken is require to comminicate with router
var token=localStorage.getItem("routro_token");

var ubus_call_id=0;
var cache_wifi_ssid="SSID";
var cache_wifi_pass="";

const NET_DUMP=["network.interface","dump",{}];
const GUEST_CLIENT=["hostapd.wlanguest_2g","get_clients",{}];
const GUEST_CLIENT_5=["hostapd.wlanguest_5g","get_clients",{}];
const WIERLESS_STATUS=["network.wireless","status"];
const VPN_ON=["file","exec",{"command":"wg_scripts.sh","params":[ "on" ]}];
const VPN_OFF=["file","exec",{"command":"wg_scripts.sh","params":[ "off" ]}];
const VPN_STAT=["file","exec",{"command":"wg_scripts.sh","params":[ "status" ]}];
const VPN_SCR=["file","exec",{"command":"wg_scripts.sh","params":[ "?" ]}];
const UPDATE_CHECK=["file","exec",{"command":"router_updater.sh","params":[ "Check" ]}];
const UPDATE_DO=["file","exec",{"command":"router_updater.sh","params":[ "Do" ]}];
const SYSUPGRADE_N=["file","exec",{"command":"router_updater.sh","params":[ "Upgrade" ]}];



const Device_ID=["uci", "get", {"config":"routro"}];
// {
//     "value": "b8917cdd927ff3bbf822f5f062225920"
// }
const WIFI_INFO=["uci", "get", {"config":"wireless"}];
// "values": {
//     ".anonymous": false,
//     ".type": "wifi-iface",
//     ".name": "default_radio0",
//     "device": "radio0",
//     "network": "lan",
//     "mode": "ap",
//     "ssid": "OpenWrt",
//     "encryption": "none"
// }
const WIFI_CHANGE=["uci", "set", {"config":"wireless", "section":"default_radio0", "values":{}}];//"ssid":"SSID" , {"key":"WIFIPASS"}
const WIFI_DISABLE=["uci", "set", {"config":"wireless", "section":"...", "values":{"disabled": "1"}}];//"ssid":"SSID" , {"key":"WIFIPASS"}
const WIFI_SCAN=["iwinfo", "scan", {"device":"wlan-ap"}];
const WIFI_DEVICES=["iwinfo", "devices",{}];
const ADMIN_CHANGE=["uci", "set", {"config":"routro", "section":"device_admin", "values":{}}];//{"key":"password"}
const ADMIN_SETP=[ "file","exec",{"command":"set_admin_pass.sh","params":[ "set" ]} ];
const UCI_COMMIT=["uci", "commit", {"config":"---"}];
const EXEC_COMMAND=[ "file", "exec", {"command":"String","params":"Array"} ];
const UCI_GET_OPENNDS=["uci", "get", {"config":"opennds", "section":"@opennds[0]"}]
const UCI_SET_OPENNDS=["uci", "set", {"config":"opennds", "section":"@opennds[0]", "values":{}}] // {"uploadrate": "1000", "downloadrate": "1000"}
const WIFI_DOWN=["network.wireless", "down"];
const WIFI_UP=["network.wireless", "up"];
const NET_RESTART=[ "rc", "init", {'name':'network','action':'restart'} ]
const NET_RELOAD=[ "rc", "init", {'name':'network','action':'reload'} ]

[
    "uci set wireless.rasio0.ssid=ali",
    "uci commit wireless",
    "rc init network restat"
]

///

///Button 
var but_update_device_info=document.getElementById("device-update");
var but_reload_device_info=document.getElementById("device-reload");
var but_scan_wifi_global=document.getElementById("scan-wifi-global-btn");

///Inputs
var input_admin_pass=document.getElementById("device-admin-password");
var input_wifi_ssid=document.getElementById("device-wifi-ssid");
var input_wifi_pass=document.getElementById("device-wifi-password");
var input_global_wifi_ssid=document.getElementById("internet-source-global-ssid");
var input_global_wifi_pass=document.getElementById("internet-source-global-pass");


var changeFlag_admin=false
var changeFlag_wifi=false
input_wifi_ssid.onfocus=function(e){
    changeFlag_wifi=true;
}
input_wifi_pass.onfocus=function(e){
    changeFlag_wifi=true;
}
input_admin_pass.onfocus=function(e){
    changeFlag_admin=true;
}
but_update_device_info.onclick = function (e) {
    e.preventDefault();
    if( input_wifi_ssid.value.length > 3 &&
        validationPassword(input_admin_pass.value, "device-admin-password")  &&
        validationPassword(input_wifi_pass.value, "device-wifi-password") )    
    {
        if( changeFlag_admin ){
            setAdminPassword();
        }
        if (changeFlag_wifi){
            setDeviceWifiInfo(input_wifi_ssid.value+"-5g", input_wifi_pass.value, "default_radio0", "0",false);
            setDeviceWifiInfo(input_wifi_ssid.value+"-2g", input_wifi_pass.value, "default_radio1", "0",true);   
        }
        
        /*ubus_call(WIFI_DOWN,chunk => {
            console.log(chunk)
            ubus_call(WIFI_UP,chunk2 =>{
                console.log(chunk2)
            });
        })*/
    }
    else{
        notif(true,"danger","Wrong Input")
    }
};


var btn_get_vpn_config = document.getElementById("get-vpn-config")
var txt_vpn_config = document.getElementById("vpn-config-notif")
btn_get_vpn_config.onclick = function(e){
    var vpnScript = VPN_SCR;
    vpnScript[2].params = ["get"]
    ubus_call(vpnScript,function(response){
        const stdout = response[1].stdout;
        if(stdout.includes("__GET_DONE__")){
            txt_vpn_config.textContent = "VPN is Ready to be connected"
            showHasConfig()
        }
        else if(stdout.includes("__Error__")){
          
            txt_vpn_config.textContent = "Something Went wrong, please check you internet and try agaign"
        }
        
        console.log(response);
    })
}

var noConfigEl = document.getElementById('if-no-config')
var hasConfigEl = document.getElementById('if-has-config')

function showNoConfig() {
    noConfigEl.classList.add('d-flex')
    noConfigEl.classList.remove('d-none')
    hasConfigEl.classList.add('d-none')
    hasConfigEl.classList.remove('d-block')
}
function showHasConfig() {
    noConfigEl.classList.remove('d-flex')
    noConfigEl.classList.add('d-none')
    hasConfigEl.classList.remove('d-none')
    hasConfigEl.classList.add('d-block')
}

function readVpnStatus(){
    ubus_call(VPN_STAT,function(response){
        // Extract the 'stdout' from the response
        const stdout = response[1].stdout;
        vpnButton.disabled=false
        showHasConfig()
        // Check if 'Connected' is present in the 'stdout'
        if (stdout.includes('__Connected__')) {
            
            connectionStatus("connected")
            vpnButton.checked = true;
            vpnSwitchLable.textContent = "Connected"
            steps_handler(4)

        } else if (stdout.includes('__Disconnected__')) {

            connectionStatus("disconnected")
            vpnButton.checked = false
            vpnSwitchLable.textContent = "Disconnected"
            steps_handler(4)

        } else if (stdout.includes('__Error__')) {

            connectionStatus("connecting")
            vpnButton.checked = true
            vpnSwitchLable.textContent = "Connection Error"

        }else if (stdout.includes('__No-Config__')) {

            connectionStatus("idle")
            vpnButton.checked = false
            vpnSwitchLable.textContent = "Connection Error"
            btn_get_vpn_config.disabled=false
            txt_vpn_config.textContent='You need VPN config, Please click on "Get Config" to get it from server'
            txt_vpn_config.style.display='block'
            showNoConfig()

        }else {

            connectionStatus("idle")
            vpnButton.checked =  false
            vpnSwitchLable.textContent = "Unknown"
        }
    })
}

function setAdminPassword() {
    ubus_call_set_and_commit(ADMIN_CHANGE,{"key":input_admin_pass.value},function(chunk){
        console.log(chunk);
        ubus_call(ADMIN_SETP,function(chunk){
            console.log(chunk);
            //get_info();
        },false)

    })
}
function setDeviceWifiInfo(ssid, pass, section, disabled, restart) {
    ubus_call_set_and_commit(prepareWifiConfig(section,disabled,ssid,pass),{},function(chunk){
        if (chunk[0] == 0){
            notif(true,"success","Device setting has been changed successfully");
            if(restart){
                ubus_call(NET_RESTART,function(temp){})
            }
            
        }
        else {
            notif(true,"warning","Something Went wrong");
        }
    })
}
function prepareWifiConfig(section,disabled,ssid,password){
    var newConfig=WIFI_CHANGE;
    newConfig[2]["section"]=section;
    newConfig[2]["values"]={
        "ssid":ssid,
        "key":password,
        "disabled": disabled
    }
    if(password){
        newConfig[2]["values"]["encryption"]= "psk2";
    }
    else{
        newConfig[2]["values"]["encryption"]= "none";
    }

    return newConfig;
}
function disableWifi(section,disable,reload){

    var newConfig=WIFI_DISABLE;
    newConfig[2]["section"]=section;
    if( disable == "0" ){
        newConfig[2]["values"]={"disabled": "0"}

    }
    ubus_call_set_and_commit(newConfig,{},function(chunk){
        if (chunk[0] == 0){
            notif(true,"success","Device setting has been changed successfully, You device will be restart, please reconnect to device after 10 secounds");
            if(reload){
                ubus_call(NET_RELOAD,function(temp){},false)
            }
            
        }
        else {
            notif(true,"warning","Something Went wrong");
        }
    })

}
function validationPassword(pass, id, allowEmpty) {
    var element = document.getElementById(id);
    var regex_test= new RegExp("^[a-zA-Z0-9-&@_*]+$");
    element.classList.remove('is-invalid');
    if(allowEmpty && pass.length === 0) {
        return true;
    }
    if (pass.length < 8 || pass.length > 20 ) {
        element.classList.add('is-invalid');
        notif(true, 'danger', 'Invalid password length!');
        return false;
    } else if ( ! regex_test.test(pass) )
    {
        element.classList.add('is-invalid');
        notif(true, 'danger', 'Password is limited to Alphanumericals and -_*&@');
        return false;
    }
    return true;
}





/// Text
var text_deviceID=document.getElementById("device-id-input");
//var text_notif=document.getElementById("text_infoResult");

// List 
var list_wifi_global=document.getElementById("internet-source-global-connect-to");
var iranInternetItem=document.getElementById("iran-internet-item");
var internetSourceGlobalReload = document.getElementById('internet-source-global-reload');

internetSourceGlobalReload.onclick = function (e) {
    e.preventDefault();
    get_info();
};

var networkInterface = 'Unknown';
var networkInterfaceIP = '0.0.0.0';
var networkInterfaceDNS = '0.0.0.0';
var networkInterfaceStatus = 'unknown';

var guestConnectedDevices = "Unknown";
var guestConnectedIP = "0.0.0.0";

function getRadioArray(jsonObj) {
    const radioArray = [];

    // Iterate over the keys of the JSON object
    for (const key in jsonObj) {
        if (key.startsWith("radio")) { // Check if key starts with "radio"
            const radioObj = jsonObj[key];
            const radioName = radioObj[".name"]; // Get the radio name
            const band = radioObj["band"]; // Get the band
            if (band.includes("5g")){
                has5G=true;
            }
            radioArray.push({"name":radioName,"band":band}); // Push [radioName, band] to the radioArray
        }
    }
    return radioArray;
}

function getStaRadios(jsonObj) {
    const staRadios = {};

    // Iterate over the keys of the JSON object
    for (const key in jsonObj) {

        const radioObj = jsonObj[key];
        const radioName = radioObj[".name"]; // Get the radio name
        const mode = radioObj["mode"]; // Get the mode
        if (mode === "sta") {
            staRadios[radioName] = radioObj; // Add to staRadios object
        }
    }

    return staRadios;
}
function removeSubstring ( mainStr , substringToRemove ){
    var mainString = mainStr
    // Check if the mainString ends with the substringToRemove
    if (mainString.endsWith(substringToRemove)) {
        // Get the length of the substringToRemove
        let substringLength = substringToRemove.length;
        // Remove the substring from the end of the mainString using slice()
        mainString = mainString.slice(0, -substringLength);
    }
    
    return mainString
}

function steps_handler(step){
    stepElements = document.getElementsByClassName("accordion-collapse");
    stepHeaderElements = document.getElementsByClassName("accordion-button");
    
    for(let i=0; i<stepElements.length ; i++){
        if ( i+1 == step ){
            stepElements[i].classList.add("show");
            stepHeaderElements[i].classList.remove("collapsed")
        }
        else{
            stepElements[i].classList.remove("show");
            stepHeaderElements[i].classList.add("collapsed")
        }
    }
}

const toastLiveExample = document.getElementById('liveToast')
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)


var toastShowCount = 0;
function heartBeat() {
    ubus_call(Device_ID,function(chunk){
        if(chunk[0] === -1) {
            toastBootstrap.show()
            toastShowCount++
        } 
        if(toastShowCount >= 3) {
            window.location.href = "index.html"
        }
    }, true);
}

setInterval(() => {
    heartBeat()
}, 5000);


//################
// # Get_Device_Info_And_Update_Values
//################
get_info();
function get_info(){
    notif(false,"success","nothing");
    showWifiElements(true)

    //Device ID and Admin Password
    ubus_call(Device_ID,function(chunk){
        var deviceInfo=chunk[1].values;
        text_deviceID.value=deviceInfo["remote"]["key"];
        input_admin_pass.value=deviceInfo["device_admin"]["key"];
    });

    //Extract the Wifi Radios 
    ubus_call(WIFI_DEVICES,function(chunk){
        var wifi_devices=chunk[1].devices;
        for(wifidev of wifi_devices){
            if(wifidev.includes("-ap-")){
                wifiApDevices.push(wifidev);
            }
        }
    })

    // Get Wifi Info
    ubus_call(WIFI_INFO,function(chunk){
        var device_wifi_info=chunk[1].values;
        wifiRadios=getRadioArray(device_wifi_info);
        var refRadio=wifiRadios[0]["name"];
        var refBand=wifiRadios[0]["band"];
        //check how many WIFI does route have
        //Set the Band
        input_wifi_ssid.value=removeSubstring(device_wifi_info["default_"+refRadio]["ssid"],"-"+refBand);
        input_wifi_pass.value=device_wifi_info["default_"+refRadio]["key"] ? device_wifi_info["default_"+refRadio]["key"] : "";
        
        input_global_wifi_ssid.value = device_wifi_info["client_"+refBand]["ssid"];
        input_global_wifi_pass.value = device_wifi_info["client_"+refBand]["key"] ? device_wifi_info["client_"+refBand]["key"] : '';

        var staWifis=getStaRadios(device_wifi_info);
        for (const key in staWifis) {
            // Internet Source
            if(device_wifi_info[key]["disabled"] == "0"){

                // set the WIfi info to Global internet and enable the local
                //handleInternetSourceSelect('wifi', 'global');
                iranInternetItem.style.display="block";
            }
        }
                    

        ubus_call(NET_DUMP,function(chunk){
            var interfaceInfo=chunk[1].interface;
            var wwanInterfaceInfo = '';

            // if(internetSource === 'cable') {
            //     wanInterfaceInfo = interfaceInfo.filter(intinf => intinf.interface === "wan");
            //     networkInterface = "Ethernet";

            // }
                
            wwanInterfaceInfo = interfaceInfo.filter(intinf => intinf.interface === "wwan");
            networkInterface = "Wireless";

            if(wwanInterfaceInfo[0].up == true ){
                internetConnectionStatus("connected")
                networkInterfaceIP = wwanInterfaceInfo[0]['ipv4-address'][0].address;
                networkInterfaceDNS = wwanInterfaceInfo[0]['dns-server'][0] ;
                console.log(wwanInterfaceInfo);
            }
            else{
                // if(internetSource === 'cable'){
                //     internetConnectionStatus("disconnected")
                // }
                // else if(internetSource === 'wifi') {
                    internetConnectionStatus("connecting")
                // }
                // else{
                //     internetConnectionStatus("needAttention")
                // }
            }
            networkInterfaceStatus = wwanInterfaceInfo[0]['up'];
            document.getElementById('network-interface').textContent = networkInterface;
            document.getElementById('network-interface-ip').textContent = networkInterfaceIP;
            document.getElementById('network-interface-dns').textContent = networkInterfaceDNS;
            document.getElementById('network-interface-status').textContent = networkInterfaceStatus;
            if (networkInterfaceStatus == true ){
                steps_handler(2);
            }
            else {
                console.log("was not true");
                console.log(networkInterfaceStatus);
            }


            var wanInfo = interfaceInfo.filter(intinf => intinf.interface === "wan");
            if(wanInfo[0].up == true ){
                iranInternetConnectionStatus("connected")
                networkInterfaceIP = wanInfo[0]['ipv4-address'][0].address;
                networkInterfaceDNS = wanInfo[0]['dns-server'][0] ;
                document.getElementById('iran-interface-name').textContent = wanInfo[0]['device'];
                document.getElementById('iran-interface-status').textContent = wanInfo[0]['proto'];;
                document.getElementById('iran-interface-ip').textContent = wanInfo[0]['ipv4-address'][0].address;
                document.getElementById('iran-interface-dns').textContent = wanInfo[0]['dns-server'][0];
            }
            else{
                iranInternetConnectionStatus("disconnected")
            }



        });

        if(device_wifi_info["guest_"+refBand]["disabled"] == "1"){
            //set the Global internet to cable and disable local internet
            guestWifiEnableControl(false);
        }
        else{
            // set the WIfi info to Global internet and enable the local
            guestWifiEnableControl(true);
        }

        guestSsid.value = removeSubstring( device_wifi_info["guest_"+refBand]["ssid"], "-"+refBand );
        guestPassword.value = device_wifi_info["guest_"+refBand]["key"];

    })

    // Read VPN Status
    readVpnStatus();


    //Read Open NDS Settings
    // ubus_get_opennds(function(chunk){
    //     const result = chunk[1]
    //     if(result && result["values"]){
    //         var uploadrate = result["values"]["uploadrate"]
    //         var downloadrate = result["values"]["downloadrate"]
    //         guestSend.value = Math.round(uploadrate/1000)
    //         guestReceive.value = Math.round(downloadrate/1000)  
    //     }
    // })

}

//Reload the device info
but_reload_device_info.onclick=function(){
    get_info();
}

function isEmpty(obj) {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
        return false;
        }
    }
    return true;
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

var list_of_avaiable_wifi=[];
var list_of_avaiable_band=[];

var wifi_list_freq=[]

but_scan_wifi_global.onclick=async function(){
    
    wifi_list_freq=[];
    list_of_avaiable_wifi=[];
    list_of_avaiable_band=[];
    
    // Remove the existing list of available wifis
    for (var i = list_wifi_global.options.length ; i > 0 ; i--) {
        list_wifi_global.options.remove(i);
    }

    for ( ap of wifiRadios ){
        var ubus_command=WIFI_SCAN
        ubus_command[2]["device"]=ap["name"]
        var band="2Ghz"
        if( ap["band"]=="5g" ){
            band="5Ghz"
        }
        var wifi_scan_raw = await async_ubus_call(ubus_command)
        var available_wifi_list=wifi_scan_raw[1].results;
        list_of_avaiable_wifi= Object.assign([],available_wifi_list,list_of_avaiable_wifi); 
    }
    
    console.log(list_of_avaiable_wifi);

    for (var i = 0; i< list_of_avaiable_wifi.length; i++){
        var opt = document.createElement('option');
        opt.value = i ;
        var wifiType = "(2.4GHz)"
        if( list_of_avaiable_wifi[i]["band"] == 5 ){
            wifiType ="(5GHz)"
        }
        var ssid = list_of_avaiable_wifi[i]["ssid"]
        if ( !ssid ){
            ssid = 'Hidden Network'
        }

        opt.innerHTML = ssid+" "+wifiType+' ( ch:'+list_of_avaiable_wifi[i]["channel"]+'   Q:'+list_of_avaiable_wifi[i]["quality"]+'    '+(
            isEmpty(list_of_avaiable_wifi[i]["encryption"]) ? 'Free' : 'Encrypted'
        )+')'  ;
        //ch:5 Q:48 Lock/Free
        list_wifi_global.appendChild(opt);
        wifi_list_freq.push(band);
    }
    
}

var globalWifiNotif = document.getElementById('wifi-connect-notif');
list_wifi_global.onchange=function(){
    input_global_wifi_pass.value = "";
    var index=this.value;
    input_global_wifi_ssid.value=list_of_avaiable_wifi[index]["ssid"];
    input_global_wifi_frq=list_of_avaiable_wifi[index]["band"];;

    globalWifiCTA.classList.remove('d-none');
    globalWifiCTA.classList.add('d-inline');

    globalWifiNotif.style.display = 'block'
}


function ubus_call(params,cb, noLoading){

    //return {};

    if(!noLoading) {
        loading(true);
    }
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
        loading(false);
        if (xhr.status === 200) {
            //parse JSON datax`x
            var resBody = JSON.parse(xhr.responseText);

            if (resBody["result"]){
                cb(resBody["result"]);
            }
            
            else{
                //console.log(resBody)
                if(resBody["error"]?.["code"] == -32002){
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

function ubus_call_set_and_commit(params,value,cb){
    var new_param=Object.assign([],params);
    new_param[2]["values"]= Object.assign(params[2]["values"],value);
    ubus_call(new_param,function(chunk){
        if(chunk[0] == 0){
            var commit_param=UCI_COMMIT;
            commit_param[2]["config"]=new_param[2]["config"];
            ubus_call(commit_param,function(chunk2){
                cb(chunk2)
            })
        }
    })
}

function ubus_exec(params,command,arg,cb){
    var new_param=params;
    new_param[2]["command"]= command;
    if (arg) {
        new_param[2]["params"]= arg;
    }
    ubus_call(new_param,function(chunk){
        cb(chunk)
    })
}

function ubus_get_opennds(cb){
    ubus_call(UCI_GET_OPENNDS,function(chunk){
        cb(chunk)
    })
}
function setRateLimit(upload,download){
    var values = {
        "uploadrate": upload,
        "downloadrate": download
    }
    ubus_set_opennds(values);

}
function ubus_set_opennds(values)
{
    var new_param= UCI_SET_OPENNDS;
    new_param[2]["values"]= Object.assign(new_param[2]["values"],values);
    ubus_call(new_param,function(chunk){
        if(chunk[0] == 0){
            var commit_param=UCI_COMMIT;
            commit_param[2]["config"]=new_param[2]["config"];
            ubus_call(commit_param,function(chunk2){
                console.log(chunk2)
            })
        }
    })

}

function loading(show,message) {
    document.getElementById('overlay').style.display = show ? 'flex' : 'none';
    var message_element = document.getElementById('overlay_message');
    if (message){
        message_element.textContent = message;
    }else{
        message_element.textContent = "Loading ...";
    }
}

var vpnButton = document.getElementById('flexSwitchCheckDefault');
var vpnStatus = document.getElementById('vpn-status');
var internetStatus = document.getElementById('internet-status');
var iranInternetStatus = document.getElementById('iran-internet-status');
var vpnStatusFlash = document.getElementById('vpn-status-flash');
var vpnSwitchLable = document.getElementById('vpnSwitchLable');
var checkUpdateButton = document.getElementById('check-update');
var doUpdateButton = document.getElementById("do-update")


function resetVPNStatusLabel() {
    vpnStatus.classList.remove(
        'bg-success',
        'bg-danger',
        'bg-secondary',
        'bg-warning',
        'text-body');
}
function resetInternetStatusLabel() {
    internetStatus.classList.remove(
        'bg-success',
        'bg-danger',
        'bg-secondary',
        'bg-warning',
        'text-body');
}
function resetIranInternetStatusLabel() {
    iranInternetStatus.classList.remove(
        'bg-success',
        'bg-danger',
        'bg-secondary',
        'bg-warning',
        'text-body');
}

vpnButton.onclick = function(e){
    vpnButton.disabled=true
    if(vpnButton.checked){
        connectionStatus("connecting")
        ubus_call(VPN_ON,function(chunk){
            //connectionStatus("connected")
            setTimeout(readVpnStatus, 3000);
        },"NO")
    }
    else{
        connectionStatus("connecting")
        ubus_call(VPN_OFF,function(chunk){
            //connectionStatus("disconnected")
            setTimeout(readVpnStatus, 3000);
        },"NO")
    }
}

checkUpdateButton.onclick = function(e){
        ubus_call(UPDATE_CHECK,function(chunk){
            if(chunk.length > 1){
                let responseTexMessage = chunk[1]["stdout"]
                document.getElementById("update-notif").textContent = responseTexMessage

                if ( responseTexMessage.includes("different") ){
                    doUpdateButton.classList.add('d-inline-block')
                    doUpdateButton.classList.remove('d-none')
                }
                else{
                    doUpdateButton.classList.remove('d-inline-block')
                    doUpdateButton.classList.add('d-none')
                }
            }
            else{
                document.getElementById("update-notif").textContent = "Connection failed"
            }

        },false)
}

doUpdateButton.onclick = function(e){
        ubus_call(UPDATE_DO,function(chunk){
            let responseTexMessage = chunk[1]["stdout"]
            document.getElementById("update-notif").textContent = responseTexMessage

            if ( responseTexMessage.includes("Successfully") ){
                document.getElementById("update-notif").textContent = "Firmware Downloaded"
                setTimeout(notif(true,"danger","upgrade will take 10 minutes, reload this page after 10 minutes"))
                loading(true,"Upgrade firmware ...\nPlease wait for 10 Minutes, Then reconncet to router and reload this page")
                ubus_call(SYSUPGRADE_N,function(chunk){
                    console.log( chunk )
                },false)
            }
            else{
                document.getElementById("update-notif").textContent = "Firmware Download Failed"
            }
            
        },false)
}

function connectionStatus(phase) {
    resetVPNStatusLabel();
    switch (phase) {
        case 'connected':
            vpnStatus.textContent = "Connected";
            vpnStatusFlash.style.visibility = "hidden";
            vpnStatus.classList.add('bg-success');
            break;
        case 'disconnected':
            vpnStatus.textContent = "Disconnected";
            vpnStatusFlash.style.visibility = "hidden";
            vpnStatus.classList.add('bg-danger');
            break;
        case 'connecting':
            vpnStatus.textContent = "Connecting...";
            vpnStatusFlash.style.visibility = "visible";
            vpnStatus.classList.add('bg-warning', 'text-body');
            break;
        default:
            vpnStatus.textContent = "Idle";
            vpnStatusFlash.style.visibility = "hidden";
            vpnStatus.classList.add('bg-secondary');

    }
}
function internetConnectionStatus(status) {
    resetInternetStatusLabel();
    switch (status) {
        case 'connected':
            internetStatus.textContent = "Connected to internet";
            internetStatus.classList.add('bg-success');
            break;
        case 'disconnected':
            internetStatus.textContent = "No Internet";
            internetStatus.classList.add('bg-danger');
            break;
        case 'connecting':
            internetStatus.textContent = "Connecting...";
            internetStatus.classList.add('bg-secondary', 'text-body');
            break;
        default:
            internetStatus.textContent = "Need Attention";
            internetStatus.classList.add('bg-warning');

    }
}
function iranInternetConnectionStatus(status) {
    resetIranInternetStatusLabel();
    switch (status) {
        case 'connected':
            iranInternetStatus.textContent = "Connected to internet";
            iranInternetStatus.classList.add('bg-success');
            break;
        case 'disconnected':
            iranInternetStatus.textContent = "No Internet";
            iranInternetStatus.classList.add('bg-danger');
            break;
        case 'connecting':
            iranInternetStatus.textContent = "Connecting...";
            iranInternetStatus.classList.add('bg-secondary', 'text-body');
            break;
        default:
            iranInternetStatus.textContent = "Need Attention";
            iranInternetStatus.classList.add('bg-warning');

    }
}

var guestWifiEnable = document.getElementById('guest-wifi-enable');
var guestWifiEnableLabel = document.getElementById('guest-wifi-enable-label');
var guestSsid = document.getElementById('guest-ssid');
var guestPassword = document.getElementById('guest-password');
var guestSend = document.getElementById('guest-send');
var guestReceive = document.getElementById('guest-receive');
var guestUpdate = document.getElementById('guest-update');
var guestReload = document.getElementById('guest-reload');
var userManagement = document.getElementById('management-btn')

guestWifiEnable.addEventListener('change', {guestWifiEnableChange});
guestWifiEnable.onclick = function(e){
    if(guestWifiEnable.checked){
        disableWifi("guest_2g", "0")
        disableWifi("guest_5g", "0" , true )  
    }else{
        disableWifi("guest_2g","1")
        disableWifi("guest_5g","1", true )
    }

}

guestUpdate.onclick = function (e) {
    e.preventDefault();
    if(guestSsid.value.length > 3 && validationPassword(guestPassword.value, "guest-password", true)) {
        setDeviceWifiInfo(guestSsid.value+"-2g", guestPassword.value, "guest_2g", guestWifiEnable.checked ? "0" : "1");
        setDeviceWifiInfo(guestSsid.value+"-5g", guestPassword.value, "guest_5g", guestWifiEnable.checked ? "0" : "1",1);
    }
    else{
        notif(true,"danger","Wrong Input")
    }
    // if(guestSend.value >=0 &&  guestReceive.value >= 0  ){
    //     setRateLimit(guestSend.value*1000,guestReceive.value*1000);
    // }
};

/*setInterval(function () {
    guestClient();
}, 5000);*/

function guestClient() {
    ubus_call(GUEST_CLIENT,function(chunk){
        var clients=chunk[1].clients;
        var connectedClientsList = document.getElementById('connected-clients-list');
        connectedClientsList.innerHTML = "";
        document.getElementById('guest-connected-devices').textContent = Object.keys(clients).length;
        ubus_call(GUEST_CLIENT_5,function(chunk){
            var clients_5g=chunk[1]?.clients;
            var totalSend = 0;
            var totalReceive = 0;
            for (var [key, value] of Object.entries(clients)) {
                var sendBytes = value.bytes.rx
                var reseiveBytes = value.bytes.tx
                totalSend += sendBytes;
                totalReceive += reseiveBytes;
                var tr = document.createElement('tr');
                var td1 = document.createElement('td');
                td1.textContent = key;
                var td2 = document.createElement('td');
                td2.textContent = parseInt((reseiveBytes + sendBytes) / (1024 * 1024));
                var td3 = document.createElement('td');
                td3.textContent = value.signal;
                var td4 = document.createElement('td');
                td4.textContent = parseInt( sendBytes / (1024*1024) ) + 'MB';
                var td5 = document.createElement('td');
                td5.textContent = parseInt(reseiveBytes / (1024*1024) ) + 'MB';
                tr.append(td1, td2, td3, td4, td5);
                connectedClientsList.append(tr);
            }
            for (var [key, value] of Object.entries(clients_5g)) {
                var sendBytes = value.bytes.rx
                var reseiveBytes = value.bytes.tx
                totalSend += sendBytes;
                totalReceive += reseiveBytes;
                var tr = document.createElement('tr');
                var td1 = document.createElement('td');
                td1.textContent = key;
                var td2 = document.createElement('td');
                td2.textContent = parseInt((reseiveBytes + sendBytes) / (1024 * 1024));
                var td3 = document.createElement('td');
                td3.textContent = value.signal;
                var td4 = document.createElement('td');
                td4.textContent = parseInt( sendBytes / (1024*1024) ) + 'MB';
                var td5 = document.createElement('td');
                td5.textContent = parseInt(reseiveBytes / (1024*1024) ) + 'MB';
                tr.append(td1, td2, td3, td4, td5);
                connectedClientsList.append(tr);
            }
            document.getElementById('guest-connected-total-send').textContent = parseInt(totalSend / (1024 * 1024)) + ' MB';
            document.getElementById('guest-connected-total-receive').textContent = parseInt(totalReceive / (1024 * 1024)) + ' MB';
            // text_deviceID.value=deviceInfo["remote"]["key"];
            // input_admin_pass.value=deviceInfo["device_admin"]["key"];
        },true)
    }, true);
}

guestReload.onclick = function () {
    get_info();
    guestClient();
};

userManagement.onclick = function(){
    window.location.href = './management.html';
}

function guestWifiEnableChange() {
    guestWifiEnableControl(this.checked);
}

function guestWifiEnableControl(status) {
    guestWifiEnable.checked = status;
    if(status) {
        guestWifiEnableLabel.textContent = "Enable";
        guestSsid.removeAttribute('disabled');
        guestPassword.removeAttribute('disabled');
        guestSend.removeAttribute('disabled');
        guestReceive.removeAttribute('disabled');

    } else {
        guestWifiEnableLabel.textContent = "Disable";
        guestSsid.setAttribute('disabled','disabled');
        guestPassword.setAttribute('disabled','disabled');
        guestSend.setAttribute('disabled','disabled');
        guestReceive.setAttribute('disabled','disabled');
    }
}

function validateForm() {
    var fileInput = document.getElementById('file');
    var file = fileInput.files[0];

    if (file) {
        var fileSize = file.size / 1024 / 1024; // Convert to MB
        if (file.type !== 'application/octet-stream' || fileSize > 16) {
            alert('Please select a valid .bin file (max 16MB).');
            return false;
        }
    }

    return true;
}