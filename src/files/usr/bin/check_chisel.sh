#!/bin/sh


LOGFILE=/var/log/chisel.log

if [ "$1" == "outline" ];then
    LOGFILE=/var/log/outline-gate.log
fi

# Filter log lines containing "Connect" (case-insensitive)
last_status=""
# Use a while loop to read each line from the grep output
while IFS= read -r line; do
    
    HAS_CONNECTED=$(echo "$line" | grep "Connected")
    HAS_CONNECTING=$(echo "$line" | grep "Connecting")

    if [ ! -z "$HAS_CONNECTED" ]; then
        last_status="Connected"
    elif [ ! -z "$HAS_CONNECTED" ]; then
        last_status="Connecting"
    else
        last_status="other"
    fi

done < <(grep -i "Connect" $LOGFILE)

echo "$last_status"