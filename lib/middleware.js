'use strict';

const _ = require('lodash');

module.exports = {

    initialize(core) {
        const handlers = {};
        const avaliable_handlers = require('../handlers');
        _.each(avaliable_handlers, (all_handlers, version) => {
            handlers[version] = {};
            _.each(all_handlers, (handler, handler_name) => {
                handlers[version][handler_name] = handler(core);
            });
        });

        const methods = {
            // ensure auth
            authed(req, res, next) {
                return next();
            },

            // allow cross origin requests
            allow_cors(req, res, next) {
                res.header('Access-Control-Allow-Origin',  '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type,Accept-Encoding');

                if(req.method == 'OPTIONS') {
                    res.stash.code = 200;
                    methods.handle_response(req, res, next);
                } else {
                    return next();
                }
            },

            // redirect to controlling leader
            redirect_to_controlling_leader(req, res, next) {
                if(core.cluster.praetor.is_controlling_leader()) {
                    return next();
                } else if('false' === req.headers['X-Containership-Api-Redirect']) {
                    return next();
                } else {
                    const controlling_leader = core.cluster.praetor.get_controlling_leader();

                    if(_.isUndefined(controlling_leader)) {
                        res.stash.code = 503;
                        methods.handle_response(req, res, next);
                    } else {
                        let port = req.headers.host.split(':');
                        if(port.length > 1) {
                            port = port[1];
                        } else {
                            port = 80;
                        }

                        const scope = core.options.legiond.network.public ? 'public' : 'private';

                        const location = `${req.protocol}://${controlling_leader.address[scope]}:${port}${req.url}`;
                        res.redirect(307, location);
                    }
                }
            },

            // ensure client accepts json
            json_request(req, res, next) {
                if(req.accepts('application/json')) {
                    return next();
                }
                res.stash.code = 406;
                methods.handle_response(req, res, next);
            },

            // init response
            init_response(req, res, next) {
                res.stash = {};
                res.response_start = new Date();
                return next();
            },

            // get appropriate handler
            get_handler(handler, method) {
                return (req, res, next) => {
                    if(!_.contains(_.keys(handlers), req.params.api_version)) {
                        methods.handle_response(req, res, next);
                    } else if(!_.has(handlers[req.params.api_version], handler)) {
                        methods.handle_response(req, res, next);
                    } else if(!_.has(handlers[req.params.api_version][handler], method)) {
                        methods.handle_response(req, res, next);
                    } else {
                        handlers[req.params.api_version][handler][method](req, res, next);
                    }
                };
            },

            // respond to client
            handle_response(req, res, next) {
                res.setHeader('X-Containership-Response-Time', new Date() - res.response_start);

                res.stash = _.defaults(res.stash, {
                    code: 404
                });

                if(_.has(res.stash, 'body'))  {
                    res.status(res.stash.code).json(res.stash.body);
                } else {
                    res.sendStatus(res.stash.code);
                }

                core.loggers['containership.api'].log('debug', `${req.ip} - HTTP/${req.httpVersion} ${req.method} ${req.url} - ${res.stash.code}`);
                return next();
            }

        };

        return methods;

    }

};
