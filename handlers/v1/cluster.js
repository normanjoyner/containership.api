'use strict';

module.exports = function(core){

    return {
        // get cluster state
        get: function(req, res, next){
            res.stash = {
                code: 200,
                body: {
                    id: core.cluster_id
                }
            }

            return next();
        },

        // kill containership on cluster
        delete: function(req, res, next) {
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
            core.cluster.legiond.exit(() => {
                res.stash.code = 204;
                next();
                return process.exit(0);
            })
        }
    }
}
