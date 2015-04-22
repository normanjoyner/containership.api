var _ = require("lodash");

module.exports = function(core){

    return {

        // get applications
        get: function(req, res, next){
            res.stash = {
                code: 200,
                body: core.applications.serialize()
            }
            return next();
        },

        // create applications
        create: function(req, res, next){
            if(!_.isUndefined(req.body)){
                if(_.has(req.query, "destroy") && req.query.destroy == "true"){
                    _.each(core.applications.list, function(application, application_name){
                        core.applications.remove(application_name);
                    });
                }

                _.each(req.body, function(application_config, application_name){
                    if(!_.has(core.applications.list, application_name)){
                        _.each(application_config.containers, function(container, container_id){
                            if(container.random_host_port)
                                container.host_port = null;

                            container.status = "unloaded";
                            container.host = null;
                            container.start_time = null;
                        });
                        core.applications.add(application_config);
                    }
                });

                core.applications.sync(function(){
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
