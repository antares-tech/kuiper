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

#
# If FOR_USER is not defined then perhaps it was provided in the arguments
#

set +x

[ -z "$FOR_USER" ] && {
	while [ $# -gt 0 ];
	do
		case $1 in
			--for) FOR_USER=$2;
				;;
		esac
		shift;
	done
}

[ -z "$FOR_USER" ] && {
	echo 'Error : env FOR_USER not defined. Run this script with --for <user-id>'
	exit 1;
}

set -x

# install redis
apt-get install -y redis-server

# Enable Unix Domain Sockets
sed -i 's@# unixsocket /var/run/redis/redis.sock@unixsocket /var/run/redis/redis.sock@g' /etc/redis/redis.conf
sed -i 's@# unixsocketperm 755@unixsocketperm 775@g' /etc/redis/redis.conf

usermod -aG redis $FOR_USER
