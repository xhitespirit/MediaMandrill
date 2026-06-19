# A MediaMandrill offers a web interface that allows remote control of a MediaMonkey 2024 instance.

### A It is built around two components:
- The Bridge: essentially a MediaMonkey script that uses the MediaMonkey APIs and exposes WebSocket
- The Server: a lightweight Node.js web server that acts as a gateway between the MediaMandrill Bridge’s WebSocket and standard HTTP(S) browsing. It exposes REST APIs and hosts the web interface.
Both bridge and server components are embedded in the MediaMandrill add-on package


## A Installation:
- Install the MediaMandrill for MediaMonkey 2024 add-on as usual from the installer package MediaMandrill.mmip


## To use MediaMandrill :
- Start MediaMonkey (obviously !)
- The MediaMandrill server will start automatically in a separate node.js window
- Open your browser and navigate to: http://YourComputerNameOrIP:4080/



## Optional: setup SSL to access MediaMandrill through https://YourComputerNameOrIP:4443/

### Generating certificates with mkcert (under Windows) if you don't already have some:

- Download mkcert from https://github.com/FiloSottile/mkcert/releases/latest
- Rename to mkcert.exe
- Install the local CA in the system trust store: mkcert -install
- Generate your certificates: mkcert yourServerName yourIpAddress (example: mkcert mycomputer.local 192.168.0.10
- Retrieve the root CA (certificate authority) rootCA.pem (to deploy later on remote clients): mkcert -CAROOT



### Configure the server to use your certificates:

- copy your certificate and key files to the 'Server' folder: .\Server\youcert.pem \Server\youcert-key.pem
- edit the server config file .\Server\config.js, and update lines with your certificate and key files name:
	export const sslCert = 'youcert.pem';
	export const sslKey = 'youcert-key.pem';



### Configure the web app to make the root CA certificate available from the menu:

- copy the root CA certificate file to the 'app' folder .\Server\app\rootCA.pem
- edit the app config file .\Server\app\js\config.js, and update line with the root CA certificate file name:
	export const certCA = 'rootCA.pem';



## Optional: change the server listening ports
- edit the server config file .\Server\config.js, and update lines with your certificate and key files name:
	export const portHttp = '4080';
	export const portHttps = '4443';
	export const portWs = '4081';
	export const portWss = '4444';	
	