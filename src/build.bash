#!/usr/bin/env bash

# This script is designed to run on Ubuntu systems with AMD64 architecture.
# Please ensure you are running this script on a compatible system.

set -e

#Openwrt Version
wrt_version="23.05.2"

#Target Device
#              Profile                Arch    Chip
targets=( "tplink_archer-c7-v5    ath79   generic" \
          "tplink_archer-c7-v2    ath79   generic" \
          "tplink_archer-a7-v5    ath79   generic" \
          "glinet_gl-mt300a       ramips  mt7620" \
          "tplink_archer-ax23-v1  ramips  mt7621"
        )

declare -A target_info
for entry in "${targets[@]}"; do
    target_info["$(echo "$entry" | awk '{print $1}')"]="$(echo "$entry" | cut -d' ' -f2-)"
done

# Excluded packages
EXCLUDE_PACKAGES='-dnsmasq -wpad-basic-mbedtls'

# Included Packages
INCLUDE_PACKAGES='curl dnsmasq-full luci luci-base iwinfo wireguard-tools kmod-nft-core kmod-nft-fib kmod-nft-nat kmod-nft-offload mtd ubus ubusd rpcd rpcd-mod-file rpcd-mod-iwinfo uci uhttpd uhttpd-mod-ubus gnupg tinyproxy jq coreutils-stat coreutils-nohup lua luasocket uhttpd-mod-lua coreutils-base64 wpad-openssl pbr kmod-br-netfilter kmod-ipt-physdev iptables-mod-physdev'

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

if [ -n "$2" ]; then
  profiles=$2
else
  profiles="${!target_info[*]}"
fi

for profile in $profiles; do

  IFS=' ' read -r cpu_arch chipset <<< "${target_info[$profile]}"

  PATH_PART="$wrt_version-$cpu_arch-$chipset"

  download_url="https://archive.openwrt.org/releases/$wrt_version/targets/$cpu_arch/$chipset/openwrt-imagebuilder-$PATH_PART.Linux-x86_64.tar.xz"

  rm -rf openwrt-imagebuilder-*
  curl -fsSL "$download_url" -O
  tar -J -x -f openwrt-imagebuilder-"$PATH_PART".Linux-x86_64.tar.xz 2>/dev/null > /dev/null

  sed -i "s/option version .*/option version '$release_version'/" "files/etc/config/routro"
  sed -i "s/option profile .*/option profile '$profile'/" "files/etc/config/routro"
  
    # Check and copy profile-specific network config if it exists
  if [ -f "files/etc/config/network.d/$profile.conf" ]; then
    cp "files/etc/config/network.d/$profile.conf" "files/etc/config/network"
  fi
  
  IMAGEBUILDER_REPO="openwrt-imagebuilder-$PATH_PART.Linux-x86_64"
  cd "$IMAGEBUILDER_REPO"

  #Make the images
  make image PROFILE="$profile" PACKAGES="$INCLUDE_PACKAGES $EXCLUDE_PACKAGES" FILES=$FILES

  dest_of_bin="bin/targets/$cpu_arch/$chipset/"

  # Loop over the files with .bin extension in the bin/ directory
  for file in $(find "$dest_of_bin" -type f -name "*.bin"); do

    newname=$(echo "$file" | sed " s|openwrt-$PATH_PART-$profile-|$profile-$release_version-| " )

    newfile=../$BUILD_DIR/$(basename "$newname")
    echo "$newfile:"
    # Rename the file
    mv "$file" "$newfile"

  done

  cd ../

done
