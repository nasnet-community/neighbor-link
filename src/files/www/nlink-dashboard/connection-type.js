
const wiredBtn = document.getElementById('wired-btn');
const wirelessBtn = document.getElementById('wireless-btn');

wiredBtn.addEventListener('click', () => {
    window.location.href = 'wan2.html';
});

wirelessBtn.addEventListener('click', () => {
    window.location.href = 'wifi.html';
});

netdump();
function netdump(){
    loading(true)
    const NET_DUMP=["network.interface","dump",{}]
    wanInterface="";
    ubus_call(NET_DUMP,function(chunk){
        if(chunk[0]==0){
            
            InterfaceInfo=chunk[1].interface;
            InterfaceInfo.forEach(element => {
                if (element.interface == "wan2") {
                    wanInterface=element 
                    wiredBtn.disabled = false;
                    console.log(element);
                } 
            });
        }
        if(wanInterface.up ){
            console.log("wanInterface")
        }

        loading(false)
        
    });
}