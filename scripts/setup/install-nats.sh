#! /bin/bash

# THIS SCRIPT ASSUMES SUDO PERMISSIONS

. vars.sh
. funcs.sh

check_sudo || exit 1;

function cleanup {
	set +x;
	echo :::: END INSTALLATION :: $BASENAME
}

function show_err {
	echo "Error exit in "$BASENAME;
}

trap "show_err; cleanup;" err
trap "cleanup;" exit SIGHUP SIGINT SIGTERM

echo :::: BEGIN INSTALLATION :: $BASENAME
set -x

#
# Actual start of action
#

# Install Nats Streaming server

cd $TEMPDIR
VERSION=v0.4.0
wget https://github.com/nats-io/nats-streaming-server/releases/download/$VERSION/nats-streaming-server-$VERSION-linux-amd64.zip
unzip -o nats-streaming-server-$VERSION-linux-amd64.zip
mv nats-streaming-server-$VERSION-linux-amd64/nats-streaming-server-$VERSION /usr/local/3a/bin

# Install Nats server
wget https://github.com/nats-io/gnatsd/releases/download/v1.1.0/gnatsd-v1.1.0-linux-amd64.zip
unzip -o gnatsd-v1.1.0-linux-amd64.zip
mv gnatsd-v1.1.0-linux-amd64/gnatsd /usr/local/3a/bin


#
# Create a generic symbolic link
#
cd /usr/local/3a/bin
ln -sf nats-streaming-server-$VERSION nats-streaming-server
