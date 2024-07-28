# Websocket dashboard data logger / plotter

## Table of contents
* [Description](#description)
* [System diagram](#system_diagram)
* [Requirement](#requirement)
* [Dependency](#dependency)
* [Install](#install)
* [Build](#build)
* [License](#license)

## <a name="build">Build</a>
* Clone this repository
* Build frontend client
    * `cd client`
    * `npm -i`
    * `npm run build`
    * `cd ..`
* Build backend server
    * `cd server`
    * `npm -i`
    * `npm run build`
    * Copy frontend build assets.
        * `npm run install-client`
    * Run the sever
        * `cd ./dist`
        * `node WebSocketDataLoggerServer.js`
        
## <a name="license">License</a>
MIT
