#!/bin/sh
# this script will Prepare the device for wireguard interface VPN

# Path to the peer.conf file
PEER_CONF_FILE="/peer.json"

# Read the necessary variables from the peer.conf file
WG_IF="wg0";
WG_ADDR=$(cat $PEER_CONF_FILE | jq ".Interface.Address" | sed 's/"//g')
WG_KEY=$(cat $PEER_CONF_FILE | jq ".Interface.PrivateKey" | sed 's/"//g')
WG_PUB=$(cat $PEER_CONF_FILE | jq ".Peer.PublicKey" | sed 's/"//g')
WG_SERV=$(cat $PEER_CONF_FILE | jq ".Peer.Endpoint" | sed 's/"//g' | cut -d':' -f1 )
WG_PORT=$(cat $PEER_CONF_FILE | jq ".Peer.Endpoint" | sed 's/"//g' | cut -d':' -f2 )
WG_PSK=$(cat $PEER_CONF_FILE | jq ".Peer.PresharedKey" | sed 's/"//g' )
WG_DNS=$(cat $PEER_CONF_FILE | jq ".Interface.DNS" | sed 's/"//g' )

echo "Setup interface"
echo "*******************"
uci -q delete network.${WG_IF}
#uci commit network
uci set network.${WG_IF}="interface"
uci set network.${WG_IF}.proto="wireguard"
uci set network.${WG_IF}.private_key=${WG_KEY}        
uci add_list network.${WG_IF}.addresses=${WG_ADDR}
uci set network.${WG_IF}.listen_port=${WG_PORT}
uci set network.${WG_IF}.metric='30'
uci set network.${WG_IF}.disabled='0'
#uci commit network

echo ""
echo "create client vpn"
echo "*******************"
# Add VPN peers
uci -q delete network.wgclient
#uci commit network
uci set network.wgclient="wireguard_${WG_IF}"
uci set network.wgclient.description=${NAME}
uci set network.wgclient.public_key=${WG_PUB}
uci set network.wgclient.route_allowed_ips="0"
uci set network.wgclient.endpoint_host=${WG_SERV}
uci set network.wgclient.endpoint_port=${WG_PORT}
if [ "$WG_PSK" -ne "null" ];then
    uci set network.wgclient.preshared_key="${WG_PSK}"
fi
uci set network.wgclient.persistent_keepalive="25"
uci add_list network.wgclient.allowed_ips="0.0.0.0/0"
uci add_list network.wgclient.allowed_ips="::/0"

uci commit network

# Check if wg0 is already in the firewall.wan.network list
if ! uci show firewall.wan.network | grep -q "wg0"; then
  # If not present, add it to the list
  uci add_list firewall.wan.network="wg0"
  # Commit changes to apply them
  uci commit firewall
  # Restart firewall to apply the new settings
  /etc/init.d/firewall restart
fi

