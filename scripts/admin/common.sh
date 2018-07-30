#
# Common include for all admin scripts
#
CURL_OPTIONS='-sS --post301 --post302 -kL'
CURL_OUTINFO='\r\nHTTP_CODE : %{http_code}\r\n'

HELPER_DIR=$DIR_CANONICAL/helpers
JS_DIR=$DIR_CANONICAL/js

which jq > /dev/null || {
	echo '"jq" not installed. Do that and try again.'
	exit 1;
}

TMP=/tmp/`basename $0`-$$
trap "rm -f $TMP $TMP_RESPONSE;" SIGHUP SIGINT SIGTERM EXIT
