#!/bin/sh
# this script will Download the config and pars it and set on networks

DEVICE_ID=$(uci get routro.remote.key )
PUBLIC_KEY=$(uci -q get network.wgclient.public_key)
WG_SHOW=$( wg show | grep handshake )

function fix_VPN_route {
    WG_HOST=$(uci get network.wgclient.endpoint_host)
    
    if [ ! -z "$WG_HOST" ]; then
        # Check if WG_HOST is an IP address
        if [[ $WG_HOST =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            WG_HOST_IP="$WG_HOST"
        else
            # Resolve WG_HOST to an IP address using nslookup
            WG_HOST_IP=$(nslookup "$WG_HOST" | awk '/^Address: / { print $2 }' | tail -n1)
        fi
        
        if [ ! -z "$WG_HOST_IP" ]; then
            # Delete existing route if it exists
            ip route del $(ip route | grep "$WG_HOST_IP" | awk '{print $1 " via " $3 " dev " $5}')
            
            WWAN_GW=$(ifstatus wwan | jq -r .data.dhcpserver)
            WWAN_DEV=$(ifstatus wwan | jq -r .device)
            
            if [ ! -z "$WWAN_GW" ]; then
                ip route add "$WG_HOST_IP" via "$WWAN_GW" dev "$WWAN_DEV" proto static metric 1
            fi
        else
            echo "Failed to resolve WG_HOST ($WG_HOST) to an IP address."
        fi
    fi
}


resp() {
    input_string="$1"
    echo "__${input_string}__"
    exit 0
}

if [ "$1" == "get" ];then
    
    sleep 3
    cat /peer.json | grep PublicKey
    if [ $? -eq 0 ]; then
        wg_prepare_config.sh    
        resp "GET_DONE"
    else
        echo "Invalid ID or Missing Info"
        resp "Error"
    fi

    
elif [ "$1" == "del" ];then 

   uci -q delete network.${WG_IF}
   uci -q delete network.wgclient
   uci commit network
   resp "Deleted"


elif [ "$1" == "on" ];then

    WG_EXIST=$(uci -q get network.wg0.private_key)
    if [ ! -z "$WG_EXIST" ];then
        echo "Turn the Wireguard ON"
        
        #uci set mwan3.vpn.use_policy='wg0_only'
        #uci commit mwan3
        uci set pbr.@policy[1].interface='wg0'
        uci commit pbr
        fix_VPN_route
        ifup wg0
        
        /etc/init.d/pbr restart
        
        resp "VPN_ON"
    else
        echo "Missing wireguard config"
        exit 0
    fi

elif [ "$1" == "off" ];then

    echo "turn of the wireguard"
    ifdown wg0

    # uci set mwan3.vpn.use_policy='wwan_only'
    # uci commit mwan3
    uci set pbr.@policy[1].interface='wwan'
    uci commit pbr
    
    fix_VPN_route
    
    /etc/init.d/pbr restart
    
    resp "VPN_OFF"
    
elif [ "$1" == "status" ];then
    WG_STATUS=$(wg | grep handshake)
    WG_IF=$(wg | grep interface)
    WG_ROUTE=$(uci -q get pbr.@policy[1].interface )
    if [ -z "$PUBLIC_KEY" ];then 
        resp "No-Config"

    elif [ "$WG_ROUTE" != "wg0" ];then
        resp "Disconnected"

    elif [  -z "$WG_IF" ];then
        resp "Disconnected"

    elif [  -z "$WG_STATUS" ];then
        resp "Error"

    else
        resp "Connected"
        
    fi

elif [ "$1" == "fix" ];then
    fix_VPN_route

elif [ "$1" == "Upgrade" ];then
    echo "Please enter the valid command"
else
    echo "Please enter the valid command"
fi


# ip route del $(ip route | grep 54.183.254.245)
# ifstatus wwan | jq .data.dhcpserver
# ifstatus wwan | jq .device
# ip route add 54.183.254.245 via 192.168.1.1 dev wlansta_5g proto static metric 1