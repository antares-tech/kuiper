#!/bin/bash

# THIS SCRIPT ASSUMES SUDO PERMISSIONS

. vars.sh
. funcs.sh
check_sudo || exit 1;

#
# Usage
#
function usage {
	echo Usage : `basename $0` ' options';
	echo '  options can be a sequence of the following:';
	echo '      --for (MANDATORY)   : <user-id>';
	echo

	exit 1;
}

#
# Process arguments
#

while [ $# -gt 0 ];
do
	case $1 in
		--for) FOR_USER=$2;
			;;
	esac
	shift;
done

[ -z "$FOR_USER" ] && usage;

export FOR_USER

#
# Setup the environment
#
cp env/3a.sh /etc/profile.d/3a.sh

mkdir -p $TEMPDIR
mkdir -p /usr/local/3a/bin

#
# Install stuff
#
$DIR/install.sh
