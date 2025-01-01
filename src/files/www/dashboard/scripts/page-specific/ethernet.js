

const checkButton = document.getElementById('check-eth-btn');
var testflag=true
checkButton.onclick = () =>{
    netdump();
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
                if (element.interface == "wan") {
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