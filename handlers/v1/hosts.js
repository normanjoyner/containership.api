var _ = require("lodash");
var async = require("async");

module.exports = function(core){

    return {
        // get all hosts
        get: function(req, res, next){
            var hosts = _.indexBy(core.cluster.legiond.get_peers(), "id");
            var attributes = core.cluster.legiond.get_attributes();
            hosts[attributes.id] = attributes;

            _.each(hosts, function(configuration, host){
                configuration.containers = [];
            });

            core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, function(err, applications){
                async.each(applications, function(application_name, fn){
                    core.cluster.myriad.persistence.get(application_name, function(err, configuration){
                        if(err)
                            return fn();

                        try{
                            configuration = JSON.parse(configuration);
                        }
                        catch(err){}

                        return fn();
                    });
                }, function(err){
                    if(err){
                        res.stash.code = 400;
                        return fn();
                    }

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
                                    var application = container_name.split("::")[2];
                                    container.application = application;
                                    hosts[container.host].containers.push(container);
                                }
                                catch(err){}
                                return fn();
                            });
                        }, function(){
                            res.stash.code = 200;
                            res.stash.body = hosts;

                            return next();
                        });
                    });
                });
            });
        }
    }

}
