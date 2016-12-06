'use strict';

const express = require('express');
const body_parser = require('body-parser');
const semver = require('semver');
const pkg = require('../package');

const middleware = require('./middleware');
const routes = require('./routes');

function Server(core, options) {
    this.options = options;
    this.core = core;
    this.server = express();
    this.middleware = middleware;
    this.routes = routes;
    this.api_version = `v${semver.major(pkg.version)}`;
}

Server.prototype.start = function() {
    this.server.use(body_parser.json({
        limit: `${this.core.options['api-max-body-size']}mb`
    }));

    this.server.disable('x-powered-by');

    this.server.param('application', (req, res, next, application) => {
        req.application = application;
        return next();
    });

    this.server.param('container', (req, res, next, container) => {
        req.container = container;
        return next();
    });

    // set required pre-operation middleware
    this.server.use(this.middleware.init_response);
    this.server.use(this.middleware.set_core(this.core));
    this.server.use(this.middleware.allow_cors);
    this.server.use(this.middleware.redirect_to_controlling_leader);
    this.server.use(this.middleware.json_request);

    // register the routes
    this.routes.register(this.server, this.middleware);

    // handle Response
    this.server.use(this.middleware.handle_response);

    // start listening
    this.server.listen(this.core.options['api-port'], this.core.options['api-interface']);
    this.core.loggers['containership.api'].log('info', `API is listening: http://${this.options['api-interface']}:${this.options['api-port']}`);
};

module.exports = Server;
