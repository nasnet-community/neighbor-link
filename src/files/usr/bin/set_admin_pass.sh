#!/bin/sh
# this script will set the admin password

KEY=$(uci -q get routro.device_admin.key)

resp() {
    input_string="$1"
    echo "__${input_string}__"
    exit 0
}

if [ "$1" == "set" ];then
    
    if [ ! -z "$KEY" ];then
        hashedKey=$(uhttpd -m "$KEY")
        uci set rpcd.@login[1].password="$hashedKey"
        uci commit rpcd
        /etc/init.d/rpcd restart
        resp Seted
    else
        resp Error
    fi
fi