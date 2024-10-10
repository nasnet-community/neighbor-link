#!/bin/sh

# Function to add MAC address to firewall
add_mac() {
    MAC_ADDRESS=$1
    RULE_NAME="Allow_MAC_$MAC_ADDRESS"

    echo "Adding MAC address: $MAC_ADDRESS to firewall"
    BLOCKING_RULE_INDEX=$(uci show firewall | grep "Drop_Guest_Traffic" | cut -d'[' -f2 | cut -d']' -f1)



    uci add firewall rule
    uci set firewall.@rule[-1].name="$RULE_NAME"
    uci set firewall.@rule[-1].src='guest_zone'
    uci set firewall.@rule[-1].src_mac="$MAC_ADDRESS"
    uci set firewall.@rule[-1].dest='*'
    uci set firewall.@rule[-1].target='ACCEPT'

    uci reorder firewall.@rule[$BLOCKING_RULE_INDEX]=10000
  
    uci commit firewall
    /etc/init.d/firewall restart
    echo "MAC address $MAC_ADDRESS added."
}

# Function to remove MAC address from firewall
remove_mac() {
    MAC_ADDRESS=$1
    RULE_NAME="Allow_MAC_$MAC_ADDRESS"

    echo "Removing MAC address: $MAC_ADDRESS from firewall"
    
    # Remove the firewall rule for both WAN and WWAN
    uci show firewall | grep "$RULE_NAME" | cut -d'[' -f2 | cut -d']' -f1 | while read -r idx; do
        uci delete firewall.@rule[$idx]
    done

    uci commit firewall
    /etc/init.d/firewall restart
    echo "MAC address $MAC_ADDRESS removed."
}

# Function to remove MAC address from firewall
check_mac() {
    if [ -z "$1" ] ; then
        exit 1
    fi
    MAC_ADDRESS=$1
    RULE_NAME="Allow_MAC_$MAC_ADDRESS"
    
    RULE_INDEX=$(uci show firewall | grep "$RULE_NAME" | cut -d'[' -f2 | cut -d']' -f1 )
    echo "$RULE_INDEX"
}

# Check for add or remove command
case "$1" in
    add)
        add_mac "$2"
        ;;
    remove)
        remove_mac "$2"
        ;;
    check)
        check_mac "$2"
        ;;
    *)
        echo "Usage: $0 {add|remove} <MAC_ADDRESS>"
        exit 1
        ;;
esac
