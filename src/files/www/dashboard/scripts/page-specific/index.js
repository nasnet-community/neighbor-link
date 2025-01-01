// let login_button=document.getElementById("button_loginBUTTON")
// let login_titlte=document.getElementById("text_loginTITLE")
let login_password_input=document.getElementById("password");
//let login_form=document.getElementsByClassName("login-form")[0];
var loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit',  loginfunction);

//login_form.addEventListener('submit',loginfunction);
// login_button.onclick=function(){
//     loginfunction();
// }

function loginfunction(e){
    e.preventDefault();
    let password=login_password_input.value;
    console.log(password);
    login(password);
}

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




function login(password){
    // login_titlte.style.color="#111111"
    // login_titlte.textContent="Try to Login"
    // open a POST request
    let body={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "call",
        "params":[
            "00000000000000000000000000000000",
            "session",
            "login",
            {            
                "username":"routro",
                "password":password
            }
        ]
    }

    // create XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://192.168.151.1/ubus");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(body));

    xhr.onload = function() {
        if (xhr.status === 200) {
            //parse JSON datax`x
            var data = JSON.parse(xhr.responseText)
            if( data["result"] ){
                if (data["result"][0]==0){
                    let token=data["result"][1]["ubus_rpc_session"];
                    if ( token.length > 10 ){
                        console.log(token);
                        localStorage.setItem("routro_token",token);
                        login_password_input.value="";
                        window.location.href = "./dashboard.html";
                    }
                }else{
                    notif(true, 'danger', "Incorrect password!");
                    // login_titlte.style.color="#EA6333" //Red
                    // login_titlte.textContent="Password incorrect";
                }
            }
            else{
                notif(true, 'warning', "Something Went Wrong!");
                // login_titlte.style.color="#EA9A33" //Orange
                // login_titlte.textContent="Something Went Wrong";
            }
            console.log(data)
        } else {
            console.log("Login was failed");
            notif(true, 'danger', "Login was failed!");
            // login_titlte.style.color="#EA9A33" //Orange
            // login_titlte.textContent="Something Went Wrong";
        }
    }

    xhr.onerror = function() {
        console.log("Network error occurred");
        notif(true, 'danger', "Network error occurred!");
        // login_titlte.style.color="#EA9A33" //Orange
        // login_titlte.textContent="Something Went Wrong";
    }
}
