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
cd $TEMPDIR
wget http://redrockdigimark.com/apachemirror/kafka/0.10.2.0/kafka_2.11-0.10.2.0.tgz
tar zxf kafka_2.11-0.10.2.0.tgz

