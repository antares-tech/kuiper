# kuiper [![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
Intended to be a service discovery module by [Antares Tech](http://antares-tech.com), for micro-services based architecture using simple NATS messaging.

## Base Idea
Two components:

	App      : Entity that wants to look for services.
	Service  : Entity that will announce it's presence and a way to reach them. Presence announcement will be made periodically and on demand.

Both Apps and Services will connect to a NATS server and listen on configured channels for messages. Services will broadcast their presence every "__pre-configured__" duration. In this broadcast, Services will also send out useful information such as "__networkInfo__" and other custom data if needed.

Apps will be listening to broadcast messages from services and managing, cataloging(among other things) all services. Managing will include keeping count of how many services of which type (user, media etc) are up etc. App module will provide all live services information when requested.

## Setup dev environment 
Setup your Ubuntu 18.04 Development Environment by runnning the following command
```
cd scripts
./setup.sh
```

## Usage
Unfinshed as of now. Check back later maybe!!
