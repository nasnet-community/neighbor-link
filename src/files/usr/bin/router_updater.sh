#!/bin/sh
# this script will Download the config and pars it and set on networks

deviceModel=$(cat /proc/device-tree/model)
deviceModel=$(echo "$deviceModel" | awk '{print tolower($0)}' | tr ' ' '_')

github_api_url=https://api.github.com/repos/nasnet-community/neighbor-link/releases/latest

json_response=$(curl -s "$github_api_url")

if [ "$1" == "Check" ];then

    new_version=$(echo "$json_response" | jq -r '.tag_name')
    active_version=$(uci get routro.firmware.version)

    # Check if the download was successful
    if [ -n "$new_version" ]; then
        
        # Compare versions
        if [ "$new_version" = "$active_version" ]; then
            echo "Versions are the same: $new_version"
        else
            echo "Versions are different. New version: $new_version, Current version: $active_version"
        fi

    else
        echo "Failed to download info from Server"
    fi
elif [ "$1" == "Do" ];then

    # Parse the array of browser_download_url values
    urls=$(echo "$json_response" | jq -r '.assets[].browser_download_url')
    # Get the device profile name generate in build script
    profile=$(uci get routro.firmware.profile)

    for url in $urls; do
        # Check if the URL contains both the profile and "sysupgrade"
        if echo "$url" | grep -q "$profile" && echo "$url" | grep -q "sysupgrade"; then
            firmwareUrl="$url"
            break
        fi
    done

    # Check if the download was successful
    if [ -n "$firmwareUrl" ]; then
        
        # Download versioning.txt using curl
        curl -L -o /tmp/firmware.bin "$firmwareUrl"

        if [ $? -eq 0 ]; then
            echo "Firmware Downloaded Successfully"
            
        else
            echo "Failed to download firmware"
        fi

    else
        echo "Failed to download info from server"
    fi

elif [ "$1" == "Upgrade" ];then
    sysupgrade  -n /tmp/firmware.bin

else
    echo "Please enter the valid command"
fi