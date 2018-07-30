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
VERSIONNAME="8.1.0"
ARCHVALUE=64
URL=http://nodejs.org/dist/v${VERSIONNAME}/node-v${VERSIONNAME}-linux-x${ARCHVALUE}.tar.gz

# setting up the folders and the the symbolic links

printf $URL"\n"
ME=$(whoami) ; sudo chown -R $ME /usr/local && cd /usr/local/bin #adding yourself to the group to access /usr/local/bin
mkdir -p _node && cd $_ && wget -q $URL -O - | tar zxf - --strip-components=1 # downloads and unzips the content to _node
cp -rf ./lib/node_modules/ /usr/local/lib/ # copy the node modules folder to the /lib/ folder
cp -rf ./include/node /usr/local/include/ # copy the /include/node folder to /usr/local/include folder
mkdir -p /usr/local/man/man1 # create the man folder
cp -f ./share/man/man1/node.1 /usr/local/man/man1/ # copy the man file
cp -f bin/node /usr/local/bin/ # copy node to the bin folder
ln -sf "/usr/local/lib/node_modules/npm/bin/npm-cli.js" ../npm ## making the symbolic link to npm

npm install -g npm@5.0.2

# print the version of node and npm
node -v
npm -v

#
# Install utilities
#
npm install -g bunyan
npm install pm2@latest -g
pm2 update
