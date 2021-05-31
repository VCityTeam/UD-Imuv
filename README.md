# UD-Viz-demo
[UD-Viz](https://github.com/VCityTeam/UD-Viz/) is an 
Demonstrations illustating some usages of the [UD-Viz JS library](https://github.com/VCityTeam/UD-Viz/).

The following sub-directories hold **pure** [front-end](https://en.wikipedia.org/wiki/Front_end_and_back_end) indenpedent applications 
```
DemoFull: client application (working with vanilla http server)
ImuvEditor: client application (working with vanilla http server)
```

In opposition `Imuv` is a [front-end](https://en.wikipedia.org/wiki/Front_end_and_back_end) application requiring `ImuvServer`
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

### Installing the pure front-end demos (DemoFull and ImuvEditor)
In order to install the pure front-end demos
 * enter the chosen sub-directory, 
 * launch `npm install` (to install the demo package dependencies),
 * run the demo with `npm run debug` command,
 * eventually open `http://localhost:8000/` with your favorite (web) browser.

For example the DemoFull application can be locally (on your desktop) started in the following way
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

Notes: TO BE CHECKED !
 * If you want to change the listening port use
   ```bash
   npm run debug -- --port=8081
   ```
 * if you want this server to be visible from another host (than the one running this npm based server) 
   then (as [documented in this issue](https://github.com/iTowns/itowns/issues/1503)) use
   ```bash
   npm run debug -- --host=0.0.0.0
   ```
   or alternatively
   ```bash
   npm run debug -- --host=<the_host_IP_number>
   ```

## Notes on the DemoFull
FIXME: unmature section

Some modules used by the DemoFull require some server-side components to be installed on
some server (possibly your desktop). For example
 * the 3D objects (buildings) are (by default) serverd by a LIRIS server
   and thus require no specific configuratione there is nothing more to do
 * handling of documents will require you to [install the API_enhanced_city](https://github.com/VCityTeam/UD-Serv/blob/master/API_Enhanced_City/INSTALL.md).
 * you can also modify the [application configuration file](DemoFull/assets/config/config.json)
 
