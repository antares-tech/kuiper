#!/bin/bash
# Install Basics
$DIR/install-basics.sh

# Install Consul
$DIR/install-consul.sh

# Install Node js
$DIR/install-node.sh

# Install Nats
$DIR/install-nats.sh

# Install REDIS
$DIR/install-redis.sh --for $USER

banner "Source ~/.bashrc or login and logout to proceed"
