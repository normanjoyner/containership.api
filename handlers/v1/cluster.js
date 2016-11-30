'use strict';

const async = require('async');

const applications = require('./applications');
const hosts = require('./hosts');

module.exports = {

    // kill containership on cluster
    delete(req, res, next) {
        const core = req.core;
        // if not the controlling leader, ignore request (X-Containership-Api-Redirect: false) must have been set
        if (!core.cluster.praetor.is_controlling_leader()) {
            res.stash.code = 400;
            res.stash.body = 'You can only kill the cluster from the controlling leader but the header \'X-Containership-Api-Redirect\' was set to \'false\'';
            return next();
        }

        // if we are the controlling leader, we must kill containership on all other hosts and then exit ourself
        const peers = core.cluster.legiond.get_peers();

        if (peers.length > 0) {
            core.cluster.legiond.send({
                event: core.constants.events.DELETE_HOST
            }, peers);
        }

        res.stash.code = 204;

        core.loggers['containership.core'].log('info', 'Host shutdown requested. Shutting down ...');
        return core.cluster.legiond.exit(() => {
            res.stash.code = 204;
            next();
            return process.exit(0);
        });
    },

    // get hosts, applications, and other cluster stuff
    state: function(req, res, next) {
        async.parallel({
            applications: (fn) => {
                applications.get(req, res, () => {
                    if(res.stash.code !== 200) {
                        return fn(new Error('Error getting applications.'));
                    }

                    return fn(null, res.stash.body);
                });
            },
            hosts: (fn) => {
                hosts.get(req, res, () => {
                    if(res.stash.code !== 200) {
                        return fn(new Error('Error getting hosts.'));
                    }

                    return fn(null, res.stash.body);
                });
            }
        }, (err, results) => {
            if(err) {
                res.stash.code = 500;
                return next();
            }

            res.stash.body = {
                applications: results.applications,
                hosts: results.hosts
            };
            res.stash.code = 200;
            return next();
        });
    }

};
