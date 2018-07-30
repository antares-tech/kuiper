#!/bin/bash
#add-client via a RESTful call to registration endpoint
#endpoint - /register/add

jq=`dirname $0`'/jq'

[ $# -lt 1 ] && { confidence="untrusted"; }
confidence="trusted"

KEY_ARR=( displayName callback_url authorization_url token_url profile_url sso_req )

TRUSTED_CLIENT=$1

echo "OAuth Client Registration, Enter the following..."

for i in "${KEY_ARR[@]}"
do
	read -p "$i : " var
	[ ${#var} -lt 1 ] && { VAL_ARR+=(""); }
	VAL_ARR+=($var)
done

KEY_STR=$(IFS='|' ; echo "${KEY_ARR[*]}")$'\n'$(IFS='|' ; echo "${VAL_ARR[*]}")

post_data=$($jq -Rn '
( input | split("|") ) as $keys | 
( inputs | split("|") ) as $vals | 
[ [$keys, $vals] | transpose[] | {key:.[0], value:.[1]} ] | from_entries' <<< "$KEY_STR")

echo "Verify the post data json object, and continue if OK"
$jq <<< $post_data

read -p "Proceed to make post req [y/n]" res
[ $res == "n" ] && { exit 1; }

echo "curl request"
#curl -X POST -H "Content-Type : application/json"
