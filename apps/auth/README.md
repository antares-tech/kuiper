Heimdallr (Authentication Gateway)

The underlying steps to configure app and auth gateway assumes the system running on one single machine and with all the peripherals -
Consul, nats-streaming-server.


Briefly, follow the below steps to configure your app with the Auth Gateway - 

1. Register your app against Authorization Gateway

2. Save the credentials returned from Authorization Gateway

3. Set config with client credentials

Explaining the above steps -


1. Register your app against Authorization Gateway -

  First and foremost an application needs to be a client known to Auth gateway according to the  OAuth2.0 protocol for authentication and authorization.
  To begin with, a developer needs to register his/her app to the Authorization Server and gain its client credentials so that one can use them for 
  authenticating with the authorization server.
   
  To register follow the steps - 

    a. change directory to m_install/scripts/admin/js/ and execute the script auth-add-client.js with the command line parameters required.
   
     There being 4 mandatory params -
   
      * type of the app [web, android, ios etc,]
      * display-name for your app
      * app-callback-url, the url at which the authorization server will redirect you to with an authorization code
      * contact, the email of the developer registering the app agains the Auth Server.
   
   NOTE : Other than these 4 params there are few other OPTIONAL paramaters which can be given according to the needs of the app.

2. Save the credentials returned from Authorization Gateway  -

  Once the registration is complete you'll be provided with your app's credentials -
    
	a. client_id
    b. client_secret

3. Set config for your app with these client_credentials
   
   Assuming the consul environment, your app needs to set config in the kv store. 
   
	a. cd m_install/scripts/admin/templates
	b. open file kv-single-machine.yml in vim or any other editor
    c. add your app's configuration using following syntax,
        
          config/app/[app-name]/client_id : [client_id]
          config/app/[app-name]/client_secret : [client_secret]
	d. save this file and you are good to go
 
Then these credentials will be needed inside your app when making request to authorization server on behalf of the user.

use these credentials in order to make request to the authorization server on behalf of the user.

