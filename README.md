# UD-Viz-demo
[UD-Viz](https://github.com/VCityTeam/UD-Viz/) is an 
Demonstrations illustating some usages of the [UD-Viz JS library](https://github.com/VCityTeam/UD-Viz/).

The sub-directorie DemoFull hold **pure** [front-end](https://en.wikipedia.org/wiki/Front_end_and_back_end) indenpedent application

In opposition `Imuv/client` is a [front-end](https://en.wikipedia.org/wiki/Front_end_and_back_end) application requiring `Imuv/server`
its [back-end](https://en.wikipedia.org/wiki/Front_end_and_back_end) node application providing an http server and a websocket communication layer (expecting Imuv client connections),

## Installing the demo applications
### Pre-requisites

* **Ubuntu**

  * Install and update npm

    ```bash
    sudo apt-get install npm    ## Will pull NodeJS
    sudo npm install -g n     
    sudo n latest
    ```

  * References: [how can I update Nodejs](https://askubuntu.com/questions/426750/how-can-i-update-my-nodejs-to-the-latest-version), and [install Ubuntu](http://www.hostingadvice.com/how-to/install-nodejs-ubuntu-14-04/#ubuntu-package-manager)

* **Windows**
  
  * Installing from the [installer](https://nodejs.org/en/download/)
  * Installing with the [CLI](https://en.wikipedia.org/wiki/Command-line_interface)

    ```bash
    iex (new-object net.webclient).downstring(‘https://get.scoop.sh’)
    scoop install nodejs
    ```

### Installing the pure front-end demo DemoFull

DemoFull application can be locally (on your desktop) started in the following way
```
cd DemoFull
npm install
npm run debug      # integrates building
```
and then use your favorite (web) browser to open
`http://localhost:8000/`.

Note that technically the `npm run debug` command will use the [webpack-dev-server](https://github.com/webpack/webpack-dev-server) npm package that
 - runs node application that in turn launched a vanilla http sever in local (on your desktop) 
 - launches a watcher (surveying changes in sources)
 - in case of change that repacks an updated bundle
 - that triggers a client (hot) reload 

## Notes on the DemoFull
FIXME: unmature section

Some modules used by the DemoFull require some server-side components to be installed on
some server (possibly your desktop). For example
 * the 3D objects (buildings) are (by default) serverd by a LIRIS server
   and thus require no specific configuratione there is nothing more to do
 * handling of documents will require you to [install the API_enhanced_city](https://github.com/VCityTeam/UD-Serv/blob/master/API_Enhanced_City/INSTALL.md).
 * you can also modify the [application configuration file](DemoFull/assets/config/config.json)
 
## Installing Imuv application

Imuv can be locally (on your desktop) started in the following way:

First install the client:
```
cd Imuv/client
npm install
npm run debug
```

Note that technically the `npm run debug` command will use the [nodemon](https://www.npmjs.com/package/nodemon) npm package that
- launches a watcher (surveying changes in sources)
- in case of change run a node.js routine (./bin/debug.js) that will repacks an updated bundle

Then install the server:
```
cd Imuv/server
npm install
npm run debug
```

Note that technically the `npm run debug` command will use the [nodemon](https://www.npmjs.com/package/nodemon) npm package that
- launches a watcher (surveying changes in sources)
- in case of change run a node.js routine (./bin/debug.js) that will repacks an updated bundle then launches the node.js server application on your desktop

and then use your favorite (web) browser to open
`http://localhost:8000/`.
