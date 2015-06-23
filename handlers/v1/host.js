var _ = require("lodash");
var async = require("async");

module.exports = function(core){

    return {
        // get host
        get: function(req, res, next){
            var hosts = _.indexBy(core.cluster.legiond.get_peers(), "id");

            var attributes = core.cluster.legiond.get_attributes();
            hosts[attributes.id] = attributes;

            var host = hosts[req.params.host];
            if(_.isUndefined(host))
                return next();

            core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, function(err, applications){
                var containers = [];

                async.each(applications, function(application_name, fn){
                    core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, application_name].join("."), function(err, configuration){
                        if(_.isNull(err)){
                            try{
                                configuration = JSON.parse(configuration);
                            }
                            catch(err){
                                return fn();
                            }

                            var matching = _.filter(configuration.containers, function(container){
                                return container.host == req.params.host;
                            });

                            containers.push(matching);
                        }
                        return fn();
                    });
                }, function(err){
                    if(err)
                        res.stash.code = 400;
                    else{
                        res.stash.body = host;
                        res.stash.body.containers = _.flatten(containers);
                    }

                    return next();
                });
            });
        },

        // update host
        update: function(req, res, next){
            if(!_.isUndefined(req.body) && _.has(req.body, "tags")){
                var hosts = _.indexBy(core.cluster.legiond.get_peers(), "id");

                var attributes = core.cluster.legiond.get_attributes();
                hosts[attributes.id] = attributes;

                var host = hosts[req.params.host];

                if(!_.isUndefined(host)){
                    this.legiond.send({
                        event: core.constants.events.UPDATE_HOST,
                        data: req.body.tags
                    }, host);

                    res.stash.code = 200;
                }
            }
            else
                res.stash.code = 400;

            return next();
        },

        // delete host
        delete: function(req, res, next){
            var hosts = _.indexBy(core.cluster.legiond.get_peers(), "id");

            var attributes = core.cluster.legiond.get_attributes();
            hosts[attributes.id] = attributes;

            var host = hosts[req.params.host];

            if(!_.isUndefined(host)){
                this.legiond.send({
                    event: core.constants.events.DELETE_HOST
                }, host);

                res.stash.code = 204;
            }

            return next();
        }
    }

}
