wrt_version := "23.05.4"

device_type := "x86-64"
# device_type := "archer-c7-v5"
# device_type := "archer-c7-v2"
# device_type := "mt300a"
# device_type := "archer-ax23-v1"

release_version := "0.1.0"  

profile := if device_type == "x86-64" {
  "generic"
} else if device_type == "archer-c7-v5" {
  "tplink_archer-c7-v5"
} else if device_type == "archer-c7-v2" {
  "tplink_archer-c7-v2"
} else if device_type == "mt300a" {
  "glinet_gl-mt300a"
} else if device_type == "archer-ax23-v1" {
  "tplink_archer-ax23-v1"
} else {
  "generic"
}

cpu_arch := if device_type == "x86-64" {
  "x86"
} else if device_type =~ "archer-[a|c]7.*" {
  "ath79"
} else if device_type == "mt300a" {
  "ramips"
} else if device_type == "archer-ax23-v1" {
  "ramips"
} else {
  "x86"
}

chipset := if device_type == "x86-64" {
  "64"
} else if device_type =~ "archer-[a|c]7.*" {
  "generic"
} else if device_type == "mt300a" {
  "mt7620"
} else if device_type == "archer-ax23-v1" {
  "mt7621"
} else {
  "64"
}


path_postfix := wrt_version + "-" + cpu_arch + "-" + chipset
files_base_path := "files_" + device_type + "/files"

exclude_pkgs := '-dnsmasq -wpad-basic-mbedtls'
include_pkgs := 'curl dnsmasq-full luci luci-base iwinfo wireguard-tools kmod-nft-core kmod-nft-fib kmod-nft-nat kmod-nft-offload mtd ubus ubusd rpcd rpcd-mod-file rpcd-mod-iwinfo uci uhttpd uhttpd-mod-ubus gnupg tinyproxy jq coreutils-stat coreutils-nohup lua luasocket uhttpd-mod-lua coreutils-base64 wpad-openssl pbr kmod-br-netfilter kmod-ipt-physdev iptables-mod-physdev'
original_files_path := justfile_directory() + "/src/files/."
bin_dir := justfile_directory() + "/build/bin-" + device_type + "-" + release_version


download_url := "https://archive.openwrt.org/releases/"+wrt_version + "/targets/" + cpu_arch + "/" + chipset + "/openwrt-imagebuilder-" + path_postfix + ".Linux-x86_64.tar.xz"

@create-build-dir:
  mkdir -p build

[working-directory: 'build']
@imagebuilder-download: create-build-dir
  echo 'Downloading imagebuilder...'
  curl -fsSL {{download_url}} -O

[working-directory: 'build']
@imagebuilder-extract: imagebuilder-download
  echo 'Extracting imagebuilder...'
  tar -J -x -f openwrt-imagebuilder-{{path_postfix}}.Linux-x86_64.tar.xz 2>/dev/null > /dev/null

[working-directory: 'build']
@imagebuilder: imagebuilder-extract
  echo 'Imagebuilder is ready'

[working-directory: 'build']
@imagebuilder-remove:
  echo 'Removing imagebuilder archive...'
  rm -rf openwrt-imagebuilder-{{path_postfix}}.Linux-x86_64*

[working-directory: 'build']
@imagebuilder-remove-all:
  echo 'Removing imagebuilder archive...'
  rm -rf openwrt-*

[working-directory: 'build']
@build-prepare:
  echo 'Preparing build...'
  mkdir -p {{files_base_path}}
  cp -r {{original_files_path}} {{files_base_path}}
  sed -i "s/option version .*/option version '{{release_version}}'/" {{files_base_path}}/etc/config/routro
  sed -i "s/option profile .*/option profile '{{profile}}'/" "{{files_base_path}}/etc/config/routro"
  if [ -f "{{files_base_path}}/etc/config/network.d/{{profile}}.conf" ]; then \
    cp "{{files_base_path}}/etc/config/network.d/{{profile}}.conf" "{{files_base_path}}/etc/config/network"; \
  fi

[working-directory: 'build']
@build-image: build-prepare
  echo 'Building image...'
  cd openwrt-imagebuilder-{{path_postfix}}.Linux-x86_64 && \
  make image PROFILE="{{profile}}" PACKAGES="{{include_pkgs}} {{exclude_pkgs}}" FILES={{files_base_path}} BIN_DIR={{bin_dir}}