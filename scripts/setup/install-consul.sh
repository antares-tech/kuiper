#!/bin/bash

. vars.sh
. funcs.sh

banner "Creating local directory $TEMPDIR"
mkdir -p $TEMPDIR

sudo mkdir -p /usr/local/antares/bin

banner "Downloading consul"
curl -s https://releases.hashicorp.com/consul/0.9.2/consul_0.9.2_linux_amd64.zip -o $TEMPDIR/consul.zip

banner "Setting up consul"
cd $TEMPDIR/
unzip -o consul.zip
sudo mv -v consul /usr/local/antares/bin
