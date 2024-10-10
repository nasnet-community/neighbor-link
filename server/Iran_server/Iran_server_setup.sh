#!/bin/bash

# Check if the script is running as root or with sudo
if [[ ! $(id -u) -eq 0 && ! $(id -g) -eq 0 ]]; then
    echo "This script requires root or sudo privileges."
    exit 1
fi

# Check if /etc/os-release file exists
if [[ -f /etc/os-release ]]; then
    # Source the os-release file to get the OS name and version
    . /etc/os-release

    # Check if the operating system is not Ubuntu
    if [[ "$ID" != "ubuntu" ]]; then
        echo "This script is only supported on Ubuntu systems."
        exit 1
    fi

    # Check if the Ubuntu version is below 20.04
    if [[ "$(printf '%s\n' "20.04" "$VERSION_ID" | sort -V | head -n1)" != "20.04" ]]; then
        echo "This script requires Ubuntu 20.04 or later."
        exit 1
    fi

else
    # If /etc/os-release does not exist, prompt the user
    echo "/etc/os-release file not found. Are you running Ubuntu 20.04 or later? (yes/no)"
    read -r confirmation
    if [[ "$confirmation" != "yes" ]]; then
        echo "This script is only supported on Ubuntu 20.04 or later."
        exit 1
    fi
fi


# Default values
DEFAULT_CHISEL_VERSION="1.10.0"
DEFAULT_CHISEL_PORT=8080


# User options
CHOOSE_DEPLOY=1
CHOOSE_RETRIEVE=2
CHOOSE_STOP_DELETE=3
CHOOSE_LIST_SERVICES=4

# Function to validate client key
validate_client_key() {
    if [[ ! -z "$CLIENT_KEY" && "${#CLIENT_KEY}" -gt 8 ]]; then
        return 0
    else
        echo "Invalid client key. It should be a non-empty string longer than 16 characters."
        return 1
    fi
}

# Function to check domain existence
check_domain_existence() {
    if [[ ! -z "$DOMAIN" ]]; then
        host "$DOMAIN" > /dev/null 2>&1
        if [[ $? -eq 0 ]]; then
            return 0
        else
            echo "Domain '$DOMAIN' does not exist."
            return 1
        fi
    fi
}

# Function to generate the string
generate_string() {
    if [[ -z "$DOMAIN" ]]; then
        SERVER_IP=$(hostname -I | awk '{print $1}')
    else
        SERVER_IP="$DOMAIN"
    fi

    echo "InRe:$CLIENT_KEY:$PASSWORD:$DEFAULT_CHISEL_PORT:$EXT_PORT1:$INT_PORT1:$EXT_PORT2:$INT_PORT2@$SERVER_IP"
}

# Function to generate a random number within a specified range, excluding a given number
function generate_random_number() {
  local min=$1
  local max=$2
  local exclude=$3
  local random_number

  while true; do
    random_number=$((RANDOM % (max - min + 1) + min))
    if [[ $random_number -ne $exclude ]]; then
      break
    fi
  done

  echo "$random_number"
}


# Function to deploy the service
deploy_service() {

    CLIENT_KEY=$(openssl rand -hex 12)
    
    echo "Please enter the domain associated with this server. This is an optional step, but it is required if you plan to use the Proxy service."
    read DOMAIN

    validate_client_key

    if [[ $? -eq 0 ]]; then

        # Install required packages
        apt update
        apt install jq openssl -y
        check_domain_existence 

        if [[ $? -eq 0 ]]; then
            apt install squid snapd nginx jq curl apache2-utils -y
            snap install certbot --classic
        fi 

        # Download and configure chisel
        wget https://github.com/jpillora/chisel/releases/download/v${DEFAULT_CHISEL_VERSION}/chisel_${DEFAULT_CHISEL_VERSION}_linux_amd64.gz
        if [[ $? -ne 0 ]]; then
            echo "Error in downloadin the service from github, If github blocked in your country please use proxy"
            exit 1;
        fi 
        gunzip chisel_${DEFAULT_CHISEL_VERSION}_linux_amd64.gz
        sudo mkdir -p /etc/chisel/clients
        mv chisel_${DEFAULT_CHISEL_VERSION}_linux_amd64 /etc/chisel/chisel_v${DEFAULT_CHISEL_VERSION}
        chmod +x /etc/chisel/chisel_v${DEFAULT_CHISEL_VERSION}

        # Create chisel user file
        PASSWORD=$(openssl rand -hex 19)
        echo "{ \"$CLIENT_KEY:$PASSWORD\" : [ \"\" ] }" > /etc/chisel/users.json

        # Create systemd file for chisel
        printf  "%s\n"\
                "[Unit]" \
                "Description=Chisel Server $DEFAULT_CHISEL_VERSION" \
                ""\
                "[Service]" \
                "User=root" \
                "Type=simple" \
                "ExecStart=/etc/chisel/chisel_v${DEFAULT_CHISEL_VERSION} server -p $DEFAULT_CHISEL_PORT --reverse --authfile /etc/chisel/users.json" \
                "Restart=on-failure" \
                "RestartSec=2s" \
                ""\
                "[Install]" \
                "WantedBy=multi-user.target" > /etc/systemd/system/chisel.service

        systemctl enable chisel.service
        systemctl start chisel.service


        EXT_PORT1=$(generate_random_number 1024 48151 $DEFAULT_CHISEL_PORT)
        EXT_PORT2=$(generate_random_number 1024 48151 $DEFAULT_CHISEL_PORT)
        while [[ $EXT_PORT2 -eq $EXT_PORT1  ]];do
            EXT_PORT2=$(generate_random_number 1024 48151 $DEFAULT_CHISEL_PORT)
        done

        # Open ports
        ufw allow $DEFAULT_CHISEL_PORT/tcp
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow $EXT_PORT1/tcp
        ufw allow $EXT_PORT2/tcp
        ufw enable


        INT_PORT1=$(generate_random_number 48152 49151 $DEFAULT_CHISEL_PORT)
        INT_PORT2=$(generate_random_number 48152 49151 $INT_PORT1)

        

        if [[ ! -z "$DOMAIN" ]]; then

            # Create nginx config
            printf  "%s\n"\
                    "server {" \
                    "   server_name $DOMAIN;" \
                    "   root /var/www/example.com;" \
                    "   index index.html;" \
                    "   location / {"\
                    "       error_page 404 /404.html;"\
                    "    }" \
                    "   listen [::]:80;"\
                    "   listen 80;"\
                    "}" > /etc/nginx/conf.d/chisel_ssl.conf

            # Obtain SSL certificate
            certbot --nginx -d "$DOMAIN" -m infinite.reach@fillimo.com --agree-tos --non-interactive

            # Todo : Setup Squid with split tunneling and parent proxy
            echo ".ir" > /etc/squid/domains.txt
            wget https://github.com/bootmortis/iran-hosted-domains/releases/download/202409020032/domains.txt
            grep -v "\.ir$" domains.txt > domains.txt.2
            sed 's/^././' domains.txt.2 >> /etc/squid/domains.txt

            htpasswd -bc /etc/squid/.squid_users ${CLIENT_KEY} ${PASSWORD}

            printf  "%s\n"\
            "https_port $EXT_PORT1 tls-cert=/etc/letsencrypt/live/$DOMAIN/fullchain.pem tls-key=/etc/letsencrypt/live/$DOMAIN/privkey.pem"\
            "auth_param basic program /usr/lib/squid/basic_ncsa_auth /etc/squid/.squid_users"\
            "auth_param basic children 5"\
            "auth_param basic realm Proxy Authentication Required"\
            "auth_param basic credentialsttl 2 hours"\
            "auth_param basic casesensitive on"\
            "acl auth_users proxy_auth REQUIRED"\
            "http_access allow auth_users"\
            "http_access deny all"\
            "cache_peer 127.0.0.1 parent $INT_PORT1 0 name=P-1 round-robin no-query weight=5 login=$CLIENT_KEY:$PASSWORD"\
            "acl ir_domain dstdomain '/etc/squid/domains.txt'"\
            "cache_peer_access P-1 allow ir_domain"\
            "never_direct allow !ir_domain"\
            "visible_hostname 'HidenLayer'" > /etc/squid/squid.conf

            systemctl restart squid

        fi

        # Generate and display string
        generate_string
        echo ""
        echo ""
        echo "Copy the following string into the Infinitereach dashboard:"
        echo ""
        echo -e "\033[0;32m$(generate_string)\033[0m"

        echo ""
        echo ""

        # Save string to file
        echo "$(generate_string)" > /etc/chisel/clients/client.str
    fi

    exit 0
}

# Function to retrieve active service config
retrieve_service_config() {
    # Implement logic to retrieve active service config
    echo "Retrieving active service config..."
    KEYSTRING=$(cat /etc/chisel/clients/client.str)

    echo ""
    echo ""
    echo "Copy the following string into the Infinitereach dashboard:"
    echo ""
    echo -e "\033[0;32m$KEYSTRING\033[0m"

    echo ""
    echo ""

    exit 0;
}

# Function to stop and delete the service
stop_delete_service() {
    # Implement logic to stop and delete the service
    echo "Stopping and deleting the service..."
}

# Function to show the list of available services
list_services() {
    # Implement logic to show the list of available services
    echo "Listing available services..."
}

# Main script logic
while true; do
    echo "Choose an option:"
    echo "1. Deploy the new service"
    echo "2. Retrieve the active service config"
    echo "5. Exit"
    read CHOICE

    case "$CHOICE" in
        1) deploy_service ;;
        2) retrieve_service_config ;;
        5) exit ;;
        *) echo "Invalid choice. Please select a number from  1, 2 and 5." ;;
    esac
done