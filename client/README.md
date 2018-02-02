# react-boilerplate

[![Build Status](https://travis-ci.org/mikechabot/react-boilerplate.svg?branch=master)](https://travis-ci.org/mikechabot/react-boilerplate)
[![Dependency Status](https://david-dm.org/mikechabot/react-boilerplate.svg)](https://david-dm.org/mikechabot/react-boilerplate)
[![Coverage Status](https://coveralls.io/repos/github/mikechabot/react-boilerplate/badge.svg?branch=master&cacheBuster=1)](https://coveralls.io/github/mikechabot/react-boilerplate?branch=master)

A slightly opinionated yet dead simple boilerplate for ReactJS, Webpack 3, and React Router v4.

#### http://mikechabot.github.io/react-boilerplate/

## Features

#### Build Process
 * Built with [webpack 3](https://webpack.js.org/configuration/)
 * Supports ES6 via [Babel](https://babeljs.io/) transpiling

#### State Management
* [redux-entity](https://github.com/mikechabot/redux-entity) for domain entity management
* [redux-thunk](https://github.com/gaearon/redux-thunk) for [asynchronous actions](https://github.com/mikechabot/react-boilerplate/blob/master/src/redux/actions/thunks.js#L6)
* [redux-logger](https://github.com/theaqua/redux-logger) for capturing actions

#### Routing
* [react-router v4](https://github.com/reactjs/react-router) for client-side [routing](https://github.com/mikechabot/react-boilerplate/blob/master/src/Root.jsx#L5)

#### HTTP
* [Customizable](https://github.com/mikechabot/react-boilerplate/blob/master/src/services/data/ajax-service.js#L8), promise-based HTTP support via [Axios](https://github.com/mzabriskie/axios)
* Implementing [data services](https://github.com/mikechabot/react-boilerplate/blob/master/src/services/data/data-access-service.js#L32) utilize [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

#### Styling
* Supports [SCSS & SASS](http://sass-lang.com/) syntax
* Browser compatibility via [autoprefixing](https://github.com/postcss/autoprefixer)

#### Develop & Deploy
* Environmental configurations for both webpack and redux
  * **Dev**: [webpack-dev-server](https://webpack.js.org/configuration/dev-server/) with [React Hot Loader](http://gaearon.github.io/react-hot-loader/). `redux-logger` enabled.
  * **Prod**: [Express](http://expressjs.com/) server with `redux-logger` disabled.

#### Testing
* Tested with [Mocha](https://mochajs.org/) and [Chai](http://chaijs.com/)
* Coverage support via [Istanbul](https://gotwarlost.github.io/istanbul/)
* [react-addons-test-utils](https://facebook.github.io/react/docs/test-utils.html) for component testing
* [Sinon.JS](http://sinonjs.org/) for mocking, stubbing & spying

## Get Started
1. `$ git clone https://github.com/mikechabot/react-boilerplate.git`
2. `$ npm install`
3. Launch environment:
   *  **Production**: `$ npm start`
   *  **Development**: `$ npm run dev`
4. Build for production:
   * `$ npm run build:prod`
5. Test:
   * `$ npm test`

### Custom Configuration

Use `cross-env` or a comparable library or command to set an environment variable (`ENV_CONFIG_PATH`) to the path of your JSON configuration file:

`$ cross-env ENV_CONFIG_PATH=/path/to/my/config npm start`

Note: This configuration path is made available to Webpack **only**, however the contents of the file are stamped on a global variable during the build process (`process.env.APP_CONFIG`, see [webpack.config.js](https://github.com/mikechabot/react-boilerplate/blob/master/webpack.config.js#L44)), which is then easily accessible via the [ConfigService](https://github.com/mikechabot/react-boilerplate/blob/master/src/services/common/config-service.js#L8).

#### Example:

Configuration located @ at `D:\_workspaces\foo.json`:

    mikec@Krait MINGW64 /d/_workspaces/react-boilerplate (master)
    $ cross-env ENV_CONFIG_PATH="D\:\_workspaces\foo.json" npm start

    > react-boilerplate@2.5.0 start D:\_workspaces\react-boilerplate
    > npm run prod

    > react-boilerplate@2.5.0 prod D:\_workspaces\react-boilerplate
    > npm run build:prod && npm run start-server

    > react-boilerplate@2.5.0 build:prod D:\_workspaces\react-boilerplate
    > cross-env NODE_ENV=production webpack --progress --colors

    ** Using custom configuration located at "D:\_workspaces\foo.json" **

    Hash: 32bbf23a46e7ac19741a
    Version: webpack 3.5.5
    Time: 8711ms
             Asset     Size  Chunks                    Chunk Names
         bundle.js   563 kB       0  [emitted]  [big]  main
    css/bundle.css  1.68 kB       0  [emitted]         main
        index.html  1.58 kB          [emitted]

