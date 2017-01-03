'use strict';

const express = require('express');
const body_parser = require('body-parser');
const pkg = require('../package');

const middleware = require('./middleware');
const routes = require('./routes');

function Server(core, options) {
    this.options = options;
    this.core = core;
    this.server = express();
    this.middleware = middleware;
    this.routes = routes;
    this.api_version = 'v1';
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

    // cannot register handle response middleware here because plugins can
    // dynamically register routes but it would happen after server initialization

    // start listening
    this.server.listen(this.core.options['api-port'], this.core.options['api-interface']);
    this.core.loggers['containership.api'].log('info', `API is listening: http://${this.options['api-interface']}:${this.options['api-port']}`);
};

module.exports = Server;
