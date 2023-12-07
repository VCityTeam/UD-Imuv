# Developers

## Pre-requisites

Developing in Imuv requires knowledge about :

- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/javascript)
- [node.js](https://en.wikipedia.org/wiki/Node.js)
- [npm](https://en.wikipedia.org/wiki/Npm_(software))
- [three.js](https://threejs.org/)
- [UD-Viz](http://github.com/VCityTeam/UD-Viz)
- [iTowns](http://www.itowns-project.org)

## NVM

Developpers are advised to use node version manager (nvm). nvm allows you to quickly install and use different versions of node via the command line.

To download and install follow this link: https://github.com/nvm-sh/nvm#installing-and-updating

## Environment Tips

### IDE

> VSCode is recommended.

#### VisualStudio Code

When using [Visual Studio Code](https://code.visualstudio.com/), you can install the following extentions to make your life easier:

- [Eslint](https://www.digitalocean.com/community/tutorials/linting-and-formatting-with-eslint-in-vs-code) - allows you e.g. to automatically fix the coding style e.g. [when saving a file](https://www.digitalocean.com/community/tutorials/linting-and-formatting-with-eslint-in-vs-code).
- [Prettier ESLint](https://marketplace.visualstudio.com/items?itemName=rvest.vs-code-prettier-eslint) - JS, JSON, CSS, and HTML formatter.
- [Mintlify](https://marketplace.visualstudio.com/items?itemName=mintlify.document) - AI-powered documentation generator. (may require rewriting by a human)

### Tips for Windows developers

As configured, the coding style requires a Linux style newline characters which might be overwritten in Windows environments
(both by `git` and/or your editor) to become `CRLF`. When such changes happen eslint will warn about "incorrect" newline characters
(which can always be fixed with `npm run eslint-fix` but this process quickly gets painful).
In order to avoid such difficulties, the [recommended pratice](https://stackoverflow.com/questions/1967370/git-replacing-lf-with-crlf)
consists in

1. setting git's `core.autocrlf` to `false` (e.g. with `git config --global core.autocrlf false`)
2. configure your editor/IDE to use Unix-style endings
3. In order to use scripts that launch a shell script with Powershell: `npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`

## Npm Scripts

### Debugging Imuv

| Script                     | Description                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run build-dev-utils`  | Run a watched routine [buildDev.js](../../bin/buildDev.js) with [nodemon](https://www.npmjs.com/package/nodemon) to create the `utils` bundle.                                                                                                                                                               |
| `npm run build-dev-game`   | Run a watched routine [buildDev.js](../../bin/buildDev.js) with [nodemon](https://www.npmjs.com/package/nodemon) to create the `game` bundle.                                                                                                                                                                |
| `npm run build-dev-editor` | Run a watched routine [buildDev.js](../../bin/buildDev.js) with [nodemon](https://www.npmjs.com/package/nodemon) to create the `editor` bundle.                                                                                                                                                              |
| `npm run dev-backend`      | Run a watched routine [backend/index.js](../../bin/backend/index.js) with [nodemon](https://www.npmjs.com/package/nodemon) to run an http server (express server with some [string-replace](https://www.npmjs.com/package/string-replace-middleware))  + a game socket service. <br>http://locahost:${PORT}/ |


### Continuous Integration (Travis CI)


Each time origin/master branch is impacted by changes, Travis CI is triggered. It does a set of jobs describe in [travis.yml](../../.travis.yml).

| Script                        | Description                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run validate-links`      | Launch script which detect links and check if they are valid. See [validateLinks.js](../../test/validateLinks.js)                     |
| `npm run test-functional`     | Run [functional.js](../../test/functional.js).Fork [`start.js`](../../bin/start.js) and check builds and server launches              |
| `npm run eslint`              | Run the linter. See [.eslintrc.js](../../.eslintrc.js)                                                                                |
| `npm audit --audit-level=low` | Npm native command ([npm-audit](https://docs.npmjs.com/cli/v6/commands/npm-audit)) which check packages dependencies vulnerabilities. |
| `npm run local-ci`            | Run CI on your local computer.                                                                                                        |



### Other
| Script                        | Description                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run clean`               | Remove files and folders generated by `npm install` and the build scripts such as `./node_modules`, `package-lock.json`, and `./dist` |
| `npm run clear-node`          | ***Linux Command***: Kill all node process (this is a sudo script)                                                                    |
| `npm run reset`               | Reinstalls npm dependencies. This script runs `npm run clean` and `npm install` command                                               |
| `npm run analyze-bundle-game` | Use [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) to see what's inside the examples bundle         |
| `npm run eslint-quiet`        | Run the linter without displaying warnings, only errors                                                                               |
| `npm run eslint-fix`          | Run the linter and attempt to fix errors and warning automatically                                                                    |



### Debugging with UDV library

If you need to code in [Imuv](https://github.com/VCityTeam/UD-Imuv) and [UD-Viz](https://github.com/VCityTeam/UD-Viz) library you should clone the two repositories side by side on your disk. Then in the package.json of Imuv you have to link with UD-Viz library (for all fields in the package.json like `@ud-viz/*`):
```json
"@ud-viz/*": "x.x.x" => "@ud-viz/*": "file:../../../UD-Viz/packages/*" //where the path is a relative path to your UD-Viz directory
```

Then reinstall ud-viz npm packages

```
npm run reset
```

Finally you have to modify the `webpack.config.js`. Add in the first position of the array which tell webpack what directories should be searched when resolving modules the UD-Viz's 'node_modules' folder: 

```js
module.exports = {
  //...
  resolve: {
    modules: ['../UD-Viz/node_modules', './node_modules'],
  },
};
```

Note that when you make a change in UD-Viz library watchers (nodemon) of Imuv will not notice it, you have to restart it yourself by typing "rs" in the watcher console.



### Workflow


Before pushing your modifications, check check if your code respects eslint rules and if your application is built correctly. For that, you can use the following command:

```
npm run local-ci
```