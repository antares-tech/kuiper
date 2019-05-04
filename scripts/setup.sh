#!/bin/bash

function apt_install {
	echo '########################################################'
	echo '#'
	echo '# Installing ' $1 ' ...'
	echo '#'
	echo '########################################################'

	sudo apt-get install -y $1
}

function banner {
	echo '########################################################'
	echo '#'
	echo '# '$*
	echo '#'
	echo '########################################################'
}

BASENAME=`basename $0`
__DIR=`dirname $0`
DIR=`cd $__DIR; pwd`
TEMPDIR=/tmp/kuiper

sudo cp env/kuiper.sh /etc/profile.d/kuiper.sh

sudo mkdir -p $TEMPDIR
sudo mkdir -p /usr/local/kuiper/bin

apt_install zip 
apt_install wget
apt_install curl
apt_install python3.6


banner "Creating local directory $TEMPDIR"
mkdir -p $TEMPDIR

sudo mkdir -p /usr/local/antares/bin

############ SETUP CONSUL #################

banner "Downloading consul"
curl -s https://releases.hashicorp.com/consul/0.9.2/consul_0.9.2_linux_amd64.zip -o $TEMPDIR/consul.zip

banner "Setting up consul"
cd $TEMPDIR/
unzip -o consul.zip
sudo mv -v consul /usr/local/antares/bin

############ SETUP NODEJS #################

VERSIONNAME="10.15.3"
ARCHVALUE=64
URL=http://nodejs.org/dist/v${VERSIONNAME}/node-v${VERSIONNAME}-linux-x${ARCHVALUE}.tar.gz

banner "Setting up Nodejs version $VERSIONNAME, npm, bunyan, and pm2"
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

npm install -g npm@6.4.1

# print the version of node and npm
# make node version manager (nvm) use the system's default node js if present
# it is aliased as "system"
node -v
npm -v

#
# Install utilities
#
npm install -g bunyan
npm install pm2@latest -g
pm2 update

########### SETUP NATS ###################

banner "Install Nats Streaming server"

cd $TEMPDIR
VERSION=v0.4.0
wget https://github.com/nats-io/nats-streaming-server/releases/download/$VERSION/nats-streaming-server-$VERSION-linux-amd64.zip
unzip -o nats-streaming-server-$VERSION-linux-amd64.zip
mv -v nats-streaming-server-$VERSION-linux-amd64/nats-streaming-server-$VERSION /usr/local/antares/bin

wget https://github.com/nats-io/gnatsd/releases/download/v1.1.0/gnatsd-v1.1.0-linux-amd64.zip
unzip -o gnatsd-v1.1.0-linux-amd64.zip
mv -v gnatsd-v1.1.0-linux-amd64/gnatsd /usr/local/antares/bin


banner "Create a generic symbolic link"

cd /usr/local/antares/bin
ln -svf nats-streaming-server-$VERSION nats-streaming-server

banner "Refersh bashrc bash profile. Login and Logout"
