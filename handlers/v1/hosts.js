var _ = require("lodash");
var async = require("async");

module.exports = function(core){

    return {
        // get all hosts
        get: function(req, res, next){
            var hosts = _.indexBy(core.cluster.legiond.get_peers(), "id");
            var attributes = core.cluster.legiond.get_attributes();
            hosts[attributes.id] = attributes;

            core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, function(err, applications){
                var containers = {};

                async.each(applications, function(application_name, fn){
                    core.cluster.myriad.persistence.get(application_name, function(err, configuration){
                        if(err)
                            return fn();

                        try{
                            configuration = JSON.parse(configuration);
                        }
                        catch(err){
                            return fn();
                        }

                        var containers_by_host = _.groupBy(configuration.containers, "host");

                        _.each(containers_by_host, function(host_containers, host){
                            if(!_.has(containers, host))
                                containers[host] = [];

                            containers[host].push(host_containers);
                        });

                        return fn();
                    });
                }, function(err){
                    if(err){
                        res.stash.code = 400;
                        return fn();
                    }

                    _.each(hosts, function(host, host_id){
                        hosts[host_id].containers = _.flatten(containers[host_id]);
                    });

                    res.stash.code = 200;
                    res.stash.body = hosts;

                    return next();
                });
            });
        }
    }

}
