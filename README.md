MediaMandrill offers a web interface that allows remote control of a MediaMonkey 2024 instance.

It is built around two components:
- The Bridge: essentially a MediaMonkey add-on that uses the MediaMonkey APIs and exposes WebSocket
- The Server: a lightweight Node.js web server that acts as a gateway between the MediaMandrill Bridge’s WebSocket and standard HTTP(S) browsing. It exposes REST APIs and hosts the web interface.

To install MediaMandrill, you’ll need to follow these steps:
- Install the MediaMandrill Bridge (MediaMonkey 2024 add-on) from the installer package MediaMandrillBridge.mmip
- Install Node.js (https://nodejs.org/en/download)
- Install the Node.js required cors package. From the terminal : npm install cors
- Install the MediaMandrill Server: copy the MediaMandrillServer folder (and its content) wherever you want it to reside on your drive

To use MediaMandrill :
- Start MediaMonkey (obviously !)
- Start MediaMandrill Server: from the folder MediaMandrillServer, double click start.cmd (or run npm start from a terminal)
- Open your browser and navigate to: http://YourComputerNameOrIP:4080/
