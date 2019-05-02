#! /bin/bash

. vars.sh
. funcs.sh


#
# Actual start of action
#

banner "Install Nats Streaming server"

cd $TEMPDIR
VERSION=v0.4.0
wget https://github.com/nats-io/nats-streaming-server/releases/download/$VERSION/nats-streaming-server-$VERSION-linux-amd64.zip
unzip -o nats-streaming-server-$VERSION-linux-amd64.zip
mv -v nats-streaming-server-$VERSION-linux-amd64/nats-streaming-server-$VERSION /usr/local/antares/bin

wget https://github.com/nats-io/gnatsd/releases/download/v1.1.0/gnatsd-v1.1.0-linux-amd64.zip
unzip -o gnatsd-v1.1.0-linux-amd64.zip
mv -v gnatsd-v1.1.0-linux-amd64/gnatsd /usr/local/antares/bin


banner "Create a generic symbolic link"

cd /usr/local/antares/bin
ln -svf nats-streaming-server-$VERSION nats-streaming-server
