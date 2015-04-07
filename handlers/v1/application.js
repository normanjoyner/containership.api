var _ = require("lodash");
var async = require("async");

module.exports = function(core){

    return {
        // get application
        get: function(req, res, next){
            res.stash.code = 200;
            res.stash.body = core.applications.list[req.params.application].serialize();
            return next();
        },

        // create application
        create: function(req, res, next){
            if(_.has(core.applications.list, req.params.application)){
                res.stash.code = 400;
                res.stash.body = { error: ["Application", req.params.application, "already exists"].join(" ") };
                return next();
            }
            else{
                var config = _.pick(req.body, [
                    "command",
                    "container_port",
                    "cpus",
                    "engine",
                    "env_vars",
                    "image",
                    "memory",
                    "network_mode",
                    "respawn",
                    "tags",
                    "volumes"
                ]);

                config.id = req.params.application;

                var application = core.applications.add(config)
                if(!_.isUndefined(application)){
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
        },

        // update application
        update: function(req, res, next){
            var application = core.applications.list[req.params.application];
            var body = {};

            if(_.has(req.body, "command"))
                body.command = req.body.command;
            if(_.has(req.body, "container_port"))
                body.container_port = req.body.container_port;
            if(_.has(req.body, "cpus"))
                body.cpus = req.body.cpus;
            if(_.has(req.body, "engine"))
                body.engine = req.body.engine;
            if(_.has(req.body, "env_vars"))
                body.env_vars = req.body.env_vars;
            if(_.has(req.body, "image"))
                body.image = req.body.image;
            if(_.has(req.body, "memory"))
                body.memory = req.body.memory;
            if(_.has(req.body, "network_mode"))
                body.network_mode = req.body.network_mode;
            if(_.has(req.body, "respawn"))
                body.respawn = req.body.respawn;
            if(_.has(req.body, "tags"))
                body.tags = req.body.tags;
            if(_.has(req.body, "volumes"))
                body.volumes = req.body.volumes;

            application.update(_.pick(req.body, [
                "command",
                "container_port",
                "cpus",
                "engine",
                "env_vars",
                "image",
                "memory",
                "network_mode",
                "respawn",
                "tags",
                "volumes"
            ]));

            core.applications.sync(function(){
                core.applications.redeploy_containers(req.params.application, function(){
                    res.stash.code = 200;
                    return core.applications.sync(next);
                });
            });
        },

        // delete application
        delete: function(req, res, next){
            core.applications.remove(req.params.application);
            res.stash.code = 204;
            return core.applications.sync(next);
        },

        // get application containers
        get_containers: function(req, res, next){
            var containers = core.applications.list[req.params.application].serialize().containers;
            res.stash.body = containers;
            res.stash.code = 200;
            return next();
        },

        // get application container
        get_container: function(req, res, next){
            var container = core.applications.list[req.params.application].containers[req.params.container];
            if(_.isUndefined(container))
                req.body.code = 404;
            else{
                res.stash.body = container;
                res.stash.code = 200;
            }

            return next();
        },

        // create application container
        create_containers: function(req, res, next){
            if(_.has(req.query, "count")){
                var body = {};

                if(_.has(req.body, "tags") && _.isObject(req.body.tags))
                    body.tags = req.body.tags;

                if(_.has(req.body, "container_port") && _.isNumber(req.body.container_port))
                    body.container_port = req.body.container_port;

                if(_.has(req.body, "host_port") && _.isNumber(req.body.host_port))
                    body.host_port = req.body.host_port;

                var errors = 0;

                async.timesSeries(_.parseInt(req.query.count), function(index, fn){
                    core.applications.deploy_container(req.params.application, body, function(err){
                        if(err)
                            errors++;

                        core.applications.sync(function(){
                            return fn();
                        });
                    });
                }, function(){
                    if(errors > 0){
                        res.stash.code = 400;
                        res.stash.body = { error: ["Failed to start", errors, "out of", req.query.count, "containers"].join(" ") }
                    }
                    else
                        res.stash.code = 201;

                    return next();
                });
            }
            else{
                res.stash.code = 400;
                res.stash.body = { error: "Please provide the 'count' query string with the number of containers to create!" };
                return next();
            }
        },

        // remove application containers
        remove_containers: function(req, res, next){
            if(_.has(req.query, "count")){
                var containers = core.applications.get_containers(req.params.application);

                var errors = 0;

                async.times(_.parseInt(req.query.count), function(index, fn){
                    var container_id = core.applications.remove_container(req.params.application);
                    if(_.isUndefined(container_id))
                        errors++;

                    return fn();
                }, function(){
                    if(errors > 0){
                        res.stash.code = 400;
                        res.stash.body = { error: ["Failed to remove", errors, "out of", req.query.count, "containers"].join(" ") }
                    }
                    else
                        res.stash.code = 204;

                    core.applications.sync(next);
                });
            }
            else{
                res.stash.code = 400;
                res.stash.body = { error: "Please provide the 'count' query string with the number of containers to remove!" };
                return next();
            }

        },

        // remove specific container
        remove_container: function(req, res, next){
            var container_id = core.applications.remove_container(req.params.application, req.params.container);
            if(_.isUndefined(container_id)){
                res.stash.code = 404;
                return next();
            }
            else{
                res.stash.code = 204;
                core.applications.sync(next);
            }
        }
    }

}
