#!/bin/bash


get="http://shunya.local:3000/register/hidden?"

[ $# -lt 3 ] && { echo Usage : `basename $0` [uuid] [client-name] [client-uri]]; exit 1; }

if [[ $3 =~ ^https?:// ]]; then
	echo $'\r\n'generating query string... $'\r\n'
else
	echo [client-url] $3 not a valid url format: \'protocol://[host][:port][/path]\'
	exit 1
fi

query="software_id=$1&client_name=$2&client-url=\"$3\""
get+=$query

#curl -X GET get
