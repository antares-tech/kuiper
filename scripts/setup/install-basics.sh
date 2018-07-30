#!/bin/bash

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

#
# Actual start of action
#
set -x
apt-get install -y zip
