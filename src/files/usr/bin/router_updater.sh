#!/bin/sh
# this script will Download the config and pars it and set on networks

deviceModel=$(cat /proc/device-tree/model)
deviceModel=$(echo "$deviceModel" | awk '{print tolower($0)}' | tr ' ' '_')
if [ "$1" == "Check" ];then
    # Define the URL for the versioning.txt file
    # TODO URL SHould be change
    url="https://s3-firmware-releases.s3.us-west-1.amazonaws.com/version-$deviceModel.txt"

    # Download versioning.txt using wget
    curl "$url" -s -o /versioning.txt.new

    # Check if the download was successful
    if [ $? -eq 0 ]; then
        
        #Containg the active_version
        source /VERSION

        #Containg the new_version
        source /versioning.txt.new

        # Compare versions
        if [ "$new_version" = "$active_version" ]; then
            echo "Versions are the same: $new_version"
        else
            echo "Versions are different. New version: $new_version, Current version: $active_version"
        fi

        # Cleanup: Remove the temporary file
        rm /versioning.txt.new
    else
        echo "Failed to download info from Server"
    fi
elif [ "$1" == "Do" ];then
    # Define the URL for the versioning.txt file
    # TODO URL Should be change
    url="https://s3-firmware-releases.s3.us-west-1.amazonaws.com/version-$deviceModel.txt"

    # Download versioning.txt using wget
    curl "$url" -s -o /versioning.txt.new

    # Check if the download was successful
    if [ $? -eq 0 ]; then
        
        # Containg new_version and firmwareUrl
        source /versioning.txt.new

        # Download versioning.txt using wget
        curl "$firmwareUrl" -s -o /tmp/firmware.bin

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