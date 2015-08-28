var _ = require("lodash");
var async = require("async");

module.exports = function(core){

    return {

        // get applications
        get: function(req, res, next){
            res.stash = {
                body: {},
                code: 200
            }

            core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, function(err, applications){
                async.each(applications, function(application_name, fn){
                    core.cluster.myriad.persistence.get(application_name, function(err, application){
                        if(err)
                            return fn();

                        try{
                            application = JSON.parse(application);
                            core.applications.get_containers(application.id, function(err, containers){
                                if(err)
                                    return fn();

                                application.containers = containers;
                                res.stash.body[application.id] = application;
                                return fn();
                            });
                        }
                        catch(err){
                            return fn();
                        }
                    });
                }, next);
            });
        },

        // create applications
        create: function(req, res, next){
            if(!_.isUndefined(req.body)){
                var all_applications;

                async.series([
                    function(fn){
                        core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, function(err, applications){
                            applications = _.map(applications, function(application){
                                return _.last(application.split("::"));
                            });

                            all_applications = applications;

                            if(_.has(req.query, "destroy") && req.query.destroy == "true"){
                                async.each(applications, function(application_name, fn){
                                    core.applications.remove(application_name, fn);
                                }, fn);
                            }
                            else
                                return fn();
                        });
                    },
                    function(fn){
                        async.each(_.keys(req.body), function(application_name, fn){
                            if(!_.contains(all_applications, application_name))
                                core.applications.add(req.body[application_name], fn);
                            else
                                return fn();
                        }, fn);
                    }
                ], function(){
                    res.stash.code = 201;
                    return next();
                });
            }
            else{
                res.stash.code = 400;
                return next();
            }
        }
    }

}
