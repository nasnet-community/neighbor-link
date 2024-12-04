var checkUpdateButton = document.getElementById('check-update');
var doUpdateButton = document.getElementById("do-update")

checkUpdateButton.onclick = function(e){
    loading(true,"Checking for update")
    const UPDATE_CHECK=["file","exec",{"command":"router_updater.sh","params":[ "Check" ]}];
    ubus_call(UPDATE_CHECK,function(chunk){
        loading(false)
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

    })
}

doUpdateButton.onclick = function(e){
    const UPDATE_DO=["file","exec",{"command":"router_updater.sh","params":[ "Do" ]}];
    const SYSUPGRADE_N=["file","exec",{"command":"router_updater.sh","params":[ "Upgrade" ]}];
    loading(true,"Preparing for upgrade")
    ubus_call(UPDATE_DO,function(chunk){
        let responseTexMessage = chunk[1]["stdout"]
        document.getElementById("update-notif").textContent = responseTexMessage

        if ( responseTexMessage.includes("Successfully") ){
            document.getElementById("update-notif").textContent = "Firmware Downloaded"
            loading(true,"Upgrade firmware... > Please wait for 10 Minutes, Then reconncet to router and reload this page")
            ubus_call(SYSUPGRADE_N,function(chunk){
                console.log( chunk )
            })
        }
        else{
            document.getElementById("update-notif").textContent = "Firmware Download Failed"
            loading(false)
        }
        
    })
}

