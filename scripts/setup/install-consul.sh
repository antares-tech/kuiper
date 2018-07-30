#!/bin/bash

# THIS SCRIPT ASSUMES SUDO PERMISSIONS

. vars.sh
. funcs.sh

check_sudo || exit 1;

function cleanup {
	rm -v $TEMPDIR/consul.zip;
	set +x;
	echo :::: END INSTALLATION :: $BASENAME
}

function show_err {
	echo "Error exit in "$BASENAME;
}

trap "show_err; cleanup;" err
trap "cleanup;" exit SIGHUP SIGINT SIGTERM

echo :::: BEGIN INSTALLATION :: $BASENAME

#
# Actual start of action
#
set -x
mkdir -p $TEMPDIR

# Get it
curl -s https://releases.hashicorp.com/consul/0.9.2/consul_0.9.2_linux_amd64.zip -o $TEMPDIR/consul.zip

cd $TEMPDIR/
unzip -o consul.zip
mv consul /usr/local/3a/bin
