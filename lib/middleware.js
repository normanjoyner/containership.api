'use strict';

const _ = require('lodash');
const ip = require('ip');
const handlers = require('../handlers');

module.exports = (core) => {

    return {
        // set core on req to be used in handlers
        set_core(req, res, next) {
            req.core = core;
            return next();
        },

        // allow cross origin requests
        allow_cors(req, res, next) {
            res.header('Access-Control-Allow-Origin',  '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type,Accept-Encoding');

            if(req.method == 'OPTIONS') {
                res.stash.code = 200;
                module.exports.handle_response(req, res, next);
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
                    module.exports.handle_response(req, res, next);
                } else {
                    let port = req.headers.host.split(':');
                    if(port.length > 1) {
                        port = port[1];
                    } else {
                        port = 80;
                    }

                    const remote_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                    const scope = ip.isPrivate(remote_address) ? 'private' : 'public';

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
            module.exports.handle_response(req, res, next);
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
                if(!_.includes(_.keys(handlers), req.params.api_version)) {
                    module.exports.handle_response(req, res, next);
                } else if(!_.has(handlers[req.params.api_version], handler)) {
                    module.exports.handle_response(req, res, next);
                } else if(!_.has(handlers[req.params.api_version][handler], method)) {
                    module.exports.handle_response(req, res, next);
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

};
