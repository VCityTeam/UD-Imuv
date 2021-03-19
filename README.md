# UD-Viz-demo
Demonstrations provided with UDSV


Notes:
 * If you want to change the listening port use
   ```bash
   npm start -- --port=8081
   ```
 * if you want this server to be visible from another host (than the one running this npm based server) 
   then (as [documented in this issue](https://github.com/iTowns/itowns/issues/1503)) use
   ```bash
   npm start -- --host=0.0.0.0
   ```
   or alternatively
   ```bash
   npm start -- --host=<the_host_IP_number>
   ```

### Developer note
When working on a specific version of the code (in particular when making changes to the underlying iTowns) you might (will) need to work with a specific version of iTowns and thus use a different install process. Refer to the 
[install.sh shell script](https://github.com/MEPP-team/UD-Viz/blob/0512f4eb0b2322224c1a4c332b8d74c6b0d1a3f8/UD-Viz-Core/install.sh) for concrete means on how to achieve this.

## Running a demo

Use your web browser to open
`http://localhost:8080/`.

If the server-side component is not installed on your computer, you will not be able to run the **full** module demo of Urban Data Viewer.

Thus, you can choose one of those solutions to do so:

  * Either you just need a view of 3D objects, in which case there is nothing more to do
  
  * Or you want to have an insight of all UD-Viz features (including handling of documents), then you need install all the tools necessary for the server-side [here](https://github.com/MEPP-team/RICT/tree/master/Install/Readme.md) in order to be able to run it locally;

  * Or you can also modify the attribute _server.url_ of the file `<path-to-UD-Viz>/UD-Viz-Core/examples/data/config/generalDemoConfig.json` as described below:
    ```
    "url":"http://rict.liris.cnrs.fr:1525/",
    ```
You will then be able to run the full module demo of UD-Viz.

## Notes

* For an install of the full pipeline of our application refer to
[these install notes](https://github.com/MEPP-team/RICT/tree/master/Install/Readme.md).
