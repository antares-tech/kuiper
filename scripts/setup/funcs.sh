function check_sudo {
	if [ "$EUID" -ne 0 ]
	then echo "Please run with sudo";
		return 1;
	fi
	return 0;
}

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

