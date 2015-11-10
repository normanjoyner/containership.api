var _ = require("lodash");
var fs = require("fs");
var express = require("express");
var body_parser = require("body-parser");

function Server(core, options){
    this.options = options;
    this.core = core;
    this.server = express();
    this.middleware = require([__dirname, "middleware"].join("/")).initialize(core);
    this.routes = require([__dirname, "routes"].join("/"));
}

Server.prototype.start = function(){
    this.server.use(body_parser.json());
    this.server.disable("x-powered-by");

    this.server.param("application", function(req, res, next, application){
        req.application = application;
        return next();
    });

    this.server.param("container", function(req, res, next, container){
        req.container = container;
        return next();
    });

    // set required pre-operation middleware
    this.server.use(this.middleware.init_response);
    this.server.use(this.middleware.allow_cors);
    this.server.use(this.middleware.redirect_to_controlling_leader);
    this.server.use(this.middleware.authed);
    this.server.use(this.middleware.json_request);

    // register the routes
    this.routes.register(this.server, this.middleware);

    // set required post-operation middleware
    this.server.use(this.middleware.handle_response);
    this.server.use(this.middleware.event_emitter);

    // start listening
    this.server.listen(this.core.options["api-port"], this.core.options["api-interface"]);
    this.core.loggers["containership.api"].log("info", ["API is listening: http://", this.options["api-interface"], ":", this.options["api-port"]].join(""));
}

module.exports = Server;
