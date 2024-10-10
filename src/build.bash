

#Target Device
wrt_version="23.05.2"
devices="tplink_archer-c7-v5 tplink_archer-a7-v5 glinet_gl-mt300a tplink_archer-c20-v5 tplink_archer-ax23-v1"
cpuarch="ath79 ath79 ramips ramips ramips"
chipset="generic generic mt7620 mt76x8 mt7621"
deviceModel="tp-link_archer_c7_v5 tp-link_archer_a7_v5 gl-mt300a tp-link_archer_c20_v5 tplink_archer-ax23-v1"


# https://downloads.openwrt.org/releases/23.05.4/targets/ramips/mt7621/openwrt-23.05.4-ramips-mt7621-tplink_archer-ax23-v1-squashfs-factory.bin

# Split the variables into arrays
IFS=' ' read -r -a p_dev <<< "$devices"
IFS=' ' read -r -a p_arch <<< "$cpuarch"
IFS=' ' read -r -a p_chip <<< "$chipset"
IFS=' ' read -r -a p_devmodel <<< "$deviceModel"



# Prompt the user to choose one of the devices
echo "Please choose one of the devices:"
for i in "${!p_dev[@]}"; do
  echo "$((i+1))) ${p_dev[i]}"
done

# Read the user input and validate it
read -p "Enter your choice: " choice
if [ "$choice" -ge 1 ] && [ "$choice" -le "${#p_dev[@]}" ]; then
    arch="${p_arch[choice-1]}"
    chip="${p_chip[choice-1]}"
    download_url="https://archive.openwrt.org/releases/$wrt_version/targets/$arch/$chip/openwrt-imagebuilder-$wrt_version-$arch-$chip.Linux-x86_64.tar.xz"
    echo "================"
    echo "You chose ${p_dev[choice-1]} -- ${p_arch[choice-1]} -- ${p_chip[choice-1]}"
    echo "================"
    PROFILE=${p_dev[choice-1]}
    
    echo $PROFILE
    read -p ">-Enter to continue-<" tempvar

    rm -rf openwrt-imagebuilder-*
    wget $download_url
    tar -J -x -f openwrt-imagebuilder-$wrt_version-$arch-$chip.Linux-x86_64.tar.xz
else
  # Echo an error message
  echo "Invalid choice. Please enter a number between 1 and ${#p_dev[@]}"
  exit 1
fi

# Set the version variable
echo "-----------------------"
DEV_MODEL=${p_devmodel[choice-1]}
echo "last release was:"
cat version-$DEV_MODEL.txt
read -p "Enter The new release version: " version

sed -i "s/option version .*/option version '$version'/" "files/etc/config/routro"
IMAGEBUILDER_REPO="openwrt-imagebuilder-$wrt_version-$arch-$chip.Linux-x86_64"
cd $IMAGEBUILDER_REPO

echo "new_version=$version" > "version-$DEV_MODEL.txt"

# Excluded packages
#EXC_PACKAGES='-dnsmasq -kmod-usb2 -kmod-usb-ohci'
EXCLUDE_PACKAGES='-dnsmasq -wpad-basic-mbedtls'

# Included Packages
# [wireguard-tools]: for Wireguard installation
#INC_PACKAGES='dnsmasq-full iwinfo openvpn-openssl kmod-nft-core kmod-nft-fib kmod-nft-nat kmod-nft-offload mtd pbr ubus ubusd uci uhttpd uhttpd-mod-ubus gnupg opennds'
INCLUDE_PACKAGES='curl dnsmasq-full iwinfo wireguard-tools kmod-nft-core kmod-nft-fib kmod-nft-nat kmod-nft-offload mtd ubus ubusd rpcd rpcd-mod-file rpcd-mod-iwinfo uci uhttpd uhttpd-mod-ubus gnupg tinyproxy jq coreutils-stat coreutils-nohup lua luasocket uhttpd-mod-lua coreutils-base64 wpad-openssl pbr kmod-br-netfilter kmod-ipt-physdev iptables-mod-physdev'

FILES="../files"


make image PROFILE=$PROFILE PACKAGES="$INCLUDE_PACKAGES $EXCLUDE_PACKAGES" FILES=$FILES

dest_of_bin="bin/targets/$arch/$chip/"

# Loop over the files with .bin extension in the bin/ directory
for file in $(find $dest_of_bin -type f -name "*.bin"); do

  newname=$(echo $file | sed " s\openwrt\v$version-openwrt\ " )
  echo $newname
  # Rename the file
  mv "$file" "$newname"
done

## Copy file into aws 
# Set the variables
bucket="s3-firmware-releases" # Replace with your bucket name
acl="public-read" # Set the ACL to public read

dest_of_bin="bin/targets/$arch/$chip/"

# Loop over the files with .bin extension in the bin/ directory
for file in $(find $dest_of_bin -type f -name "*.bin"); do
  firmware_url_key="firmwareUrl"
  if [[ "$file" == *"factory"* ]]
  then
    firmware_url_key="fimwareUrlFactory"
  fi
  aws  --profile holestic s3 cp $file s3://$bucket/ --acl $acl
  echo "---------"
  echo $file
  filename=$(basename "$file" )
  echo ""
  echo "https://$bucket.s3.us-west-1.amazonaws.com/$filename"
  echo "$firmware_url_key=https://$bucket.s3.us-west-1.amazonaws.com/$filename" >> version-$DEV_MODEL.txt
  echo "---------"
done

aws  --profile holestic s3 cp version-$DEV_MODEL.txt s3://$bucket/ --acl $acl

# Upload the file using the AWS CLI
#aws s3 cp $file s3://$bucket/ --acl $acl

# Check the exit status
if [ $? -eq 0 ]; then
  echo "File uploaded successfully."
  cp version-$DEV_MODEL.txt ../
else
  echo "File upload failed."
fi



# sysupgrade -n v0.0.6-openwrt-22.03.3-ath79-generic-tplink_archer-c7-v5-squashfs-sysupgrade.bin
# Mon Jan 15 16:48:59 UTC 2024 upgrade: Commencing upgrade. Closing all shell sessions.
# Command failed: Connection failed
# root@OpenWrt:/tmp# Connection to 192.168.151.1 closed by remote host.
# Connection to 192.168.151.1 closed.