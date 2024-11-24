
#!/bin/bash

# This script is designed to run on Ubuntu systems with AMD64 architecture.
# Please ensure you are running this script on a compatible system.

set -e

#Openwrt Version
wrt_version="23.05.2"

#Target Device
#              Profile                Arch    Chip    Model
target_info=( "tplink_archer-c7-v5    ath79   generic tp-link_archer_c7_v5" \
              "tplink_archer-c7-v2    ath79   generic tp-link_archer_c7_v2" \
              "tplink_archer-a7-v5    ath79   generic tp-link_archer_a7_v5" \
              "glinet_gl-mt300a       ramips  mt7620  gl-mt300a" \
              "tplink_archer-ax23-v1  ramips  mt7621  tp-link_archer-ax23-v1"
            )

# Excluded packages
EXCLUDE_PACKAGES='-dnsmasq -wpad-basic-mbedtls'

# Included Packages
INCLUDE_PACKAGES='curl dnsmasq-full iwinfo wireguard-tools kmod-nft-core kmod-nft-fib kmod-nft-nat kmod-nft-offload mtd ubus ubusd rpcd rpcd-mod-file rpcd-mod-iwinfo uci uhttpd uhttpd-mod-ubus gnupg tinyproxy jq coreutils-stat coreutils-nohup lua luasocket uhttpd-mod-lua coreutils-base64 wpad-openssl pbr kmod-br-netfilter kmod-ipt-physdev iptables-mod-physdev'

FILES="../files"

BUILD_DIR="build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# The new release version should be transfered as a first variable
if [ -n "$1" ]; then
  release_version=$1
else
  release_version="0.0.0"
fi


for target in "${target_info[@]}"; do

  IFS=' ' read -r profile cpu_arch chipset  device_model <<< "$target"

  PATH_PART="$wrt_version-$cpu_arch-$chipset"
  
  download_url="https://archive.openwrt.org/releases/$wrt_version/targets/$cpu_arch/$chipset/openwrt-imagebuilder-$PATH_PART.Linux-x86_64.tar.xz"

  rm -rf openwrt-imagebuilder-*
  wget $download_url
  tar -J -x -f openwrt-imagebuilder-$PATH_PART.Linux-x86_64.tar.xz

  sed -i "s/option version .*/option version '$release_version'/" "files/etc/config/routro"
  IMAGEBUILDER_REPO="openwrt-imagebuilder-$PATH_PART.Linux-x86_64"
  cd $IMAGEBUILDER_REPO

  TEXT_FILE=../$BUILD_DIR/version-$device_model.txt
  echo "new_version=$release_version" > $TEXT_FILE

  #Make the images
  make image PROFILE=$profile PACKAGES="$INCLUDE_PACKAGES $EXCLUDE_PACKAGES" FILES=$FILES

  dest_of_bin="bin/targets/$arch/$chip/"

  # Loop over the files with .bin extension in the bin/ directory
  for file in $(find $dest_of_bin -type f -name "*.bin"); do

    newname=$(echo $file | sed " s|openwrt-$PATH_PART-$profile-|$device_model-$release_version-| " )
   
    newfile=../$BUILD_DIR/$(basename "$newname")
    echo "$newfile:"
    # Rename the file
    mv "$file" $newfile

    if [[ "$file" == *"sysupgrade"* ]];then
      filename=$(basename "$newname" )
      echo "firmwareUrl=https://github.com/nasnet-community/neighbor-link/blob/0f2001dd371d02357248beb61ec9a812d82a743a/builds/$filename" >> $TEXT_FILE
    fi

  done
  
  cd ../

done