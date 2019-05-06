#!/bin/bash

function banner {
	echo '########################################################'
	echo '#'
	echo '# '$*
	echo '#'
	echo '########################################################'
}

#
# Check mandatories
#
[ -z `which gnatsd` ] && { echo gnatsd not found; exit 1; }

banner "Starting NATS server"
pm2 start --name _nats gnatsd --interpreter none -x
