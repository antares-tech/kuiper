function check_sudo {
	if [ "$EUID" -ne 0 ]
	  then echo "Please run with sudo";
	  return 1;
	fi
	return 0;
}
