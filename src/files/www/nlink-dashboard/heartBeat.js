const toastLiveExample = document.getElementById('liveToast')
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
var toastShowCount = 0;
var isSet=false
function heartBeat() {
    const Device_ID=["uci", "get", {"config":"routro"}];
    ubus_call(Device_ID,function(chunk){
        if(chunk[0] !== 0) {
            toastBootstrap.show()
            toastShowCount++
        } 
        else if(chunk[1]?.values?.firmware?.version){
            if(isSet==false){
                const versionSeen = localStorage.getItem("opr-version-seen");
                const currentVersion = chunk[1]?.values?.firmware?.version
                if(currentVersion != versionSeen){
                    localStorage.setItem("opr-dashboard-seen","false")
                }
                localStorage.setItem("opr-version-seen",chunk[1]?.values?.firmware?.version);
                isSet=true;
            }
        }
        if(toastShowCount >= 3) {
            window.location.href = "index.html"
        }
    }, true);
}

setInterval(() => {
    heartBeat()
}, 5000);