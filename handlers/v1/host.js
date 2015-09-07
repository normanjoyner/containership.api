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

            host.containers = [];

            core.cluster.myriad.persistence.keys([core.constants.myriad.CONTAINERS_PREFIX, "*", "*"].join("::"), function(err, containers){
                if(err){
                    res.stash.code = 400;
                    return fn();
                }

                async.each(containers, function(container_name, fn){
                    core.cluster.myriad.persistence.get(container_name, function(err, container){
                        if(err)
                            return fn();

                        try{
                            container = JSON.parse(container);
                            if(container.host == host.id){
                                container.application = container_name.split("::")[2];
                                host.containers.push(container);
                            }
                        }
                        catch(err){}
                        return fn();
                    });
                }, function(){
                    res.stash.code = 200;
                    res.stash.body = host;
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
                    core.cluster.legiond.send({
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
                core.cluster.legiond.send({
                    event: core.constants.events.DELETE_HOST
                }, host);

                res.stash.code = 204;
            }

            return next();
        }
    }

}
