#!/bin/bash

# THIS SCRIPT ASSUMES SUDO PERMISSIONS

. vars.sh
. funcs.sh

# Install Basics
$DIR/install-basics.sh

# Install Consul
$DIR/install-consul.sh

# Install Node js
$DIR/install-node.sh

# Install Mongo
$DIR/install-mongo.sh

# Install Java
#$DIR/install-java.sh

# Install Nats
$DIR/install-nats.sh

# Install Grunt
#$DIR/install-grunt.sh

# Install MIsc
#$DIR/install-misc.sh

# Install NGINX
#$DIR/install-nginx.sh

# Install REDIS
#$DIR/install-redis.sh

banner "Source ~/.bashrc or login and logout to proceed"
