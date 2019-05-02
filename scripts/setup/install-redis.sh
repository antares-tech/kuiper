#! /bin/bash

. vars.sh
. funcs.sh

#
# If FOR_USER is not defined then perhaps it was provided in the arguments
#


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

banner "Install redis"
apt_install redis-server

# Enable Unix Domain Sockets
sudo sed -i 's@# unixsocket /var/run/redis/redis.sock@unixsocket /var/run/redis/redis.sock@g' /etc/redis/redis.conf
sudo sed -i 's@# unixsocketperm 755@unixsocketperm 775@g' /etc/redis/redis.conf

sudo usermod -aG redis $FOR_USER
