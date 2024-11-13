#!/bin/sh
# Define the file name and the URL to download from
FILE="/tmp/chisel"
# TODO : Some arch is not compatible with this
ARCH=$(uname -m)
URL="https://holistic-config.s3.us-west-1.amazonaws.com/chisel/chisel_1.10.0_linux_${ARCH}_softfloat"

reverse_string() {
  input=$1
  reversed=""

  # Use a while loop to reverse the string
  len=${#input}
  while [ $len -gt 0 ]; do
    len=$((len - 1))
    reversed="$reversed${input:$len:1}"
  done

  echo "$reversed"
}

# Check if the file exists
if [ ! -f "$FILE" ]; then
    # Download the file with curl
    curl "$URL" -s -o "$FILE" 
    if [ $? -eq 0 ]; then
        chmod +x "$FILE"
        # Restart the chisel service
        /etc/init.d/chisel restart
        /etc/init.d/outlineGate restart
    else
        logger -t pmaster "Download failed, check /tmp/wget.log"
        exit 1
    fi
else
    if [ $(stat -c %s /tmp/chisel) -gt 9500000 ]; then
        if ! pgrep chisel; then
            # Restart the chisel service
            /etc/init.d/chisel restart
            /etc/init.d/outlineGate restart
        fi       
    else
        rm /tmp/chisel
        curl "$URL" -s -o "$FILE" 
    fi
fi
