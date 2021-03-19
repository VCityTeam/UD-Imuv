# UD-Viz-demo
Demonstrations illustating some usages of the [UD-Viz JS library](https://github.com/VCityTeam/UD-Viz/).

The following sub-directories are independent applications
```
DemoFull: client application (working with vanilla http server)
ImuvEditor: client application (working with vanilla http server)
Imuv: client application (working with the ImuvServer )
ImuvServer: a node application (providing an http server and expecting Imuv client connections)
```

The simple (using a vanilla http server) client applications can be locally (on your desktop)
started in the following way
```
cd DemoFull
npm install
npm run debug      # integrates building
```
and then use your favorite (web) browser to open
`http://localhost:8000/`.

Notes:
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
 
