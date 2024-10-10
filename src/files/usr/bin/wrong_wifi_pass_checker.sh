#!/usr/bin/sh

# Define your space-separated string variable
DEVICES="wlansta_2g wlansta_5g"


confname(){
    if [ "$1" == "wlansta_2g" ];then
        echo "client_2g";
    elif [ "$1" == "wlansta_5g" ];then
        echo "client_5g";
    fi
}
# Function to disable the interface
disable_interface() {
    interface=$1
    config=$(confname $interface)
    uci set wireless.$config.disabled='1'
    uci commit wireless
    /etc/init.d/network reload
    echo "Interface $interface disabled"
}

# Function to check the IP address of the interface
check() {
    interface=$1
    config=$(confname $interface)

    # Check if the WiFi STA interface is enabled
    wifi_status=$(uci get wireless.$config.disabled)

    # If the interface is enabled (0), then check the connection
    if [ "$wifi_status" = "0" ]; then

        IP=$(ifconfig $interface | grep 'inet addr' | awk -F: '{print $2}' | awk '{print $1}')

        counterfile="/tmp/$device.value"
        if [ -z "$IP" ]; then
            echo $interface has not ip
            if [ ! -f "$counterfile" ]; then
                echo 0 > "$counterfile"
            fi

            value=$(cat "$counterfile")
            value=$((value + 1))
            if [ "$value" -gt 5 ]; then
                disable_interface $interface
                echo "$interface has been disabled"
                rm -f $counterfile
            fi

            echo $value > "$counterfile"
            return
        
        else
            rm -f $counterfile
        fi
    else
        echo "interface=$interface Not found"
    fi
}



while true; do
    # Iterate over devices
    for device in $DEVICES; do
        check $device
    done
    sleep 10
done