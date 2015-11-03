var _ = require("lodash");
var async = require("async");

module.exports = function(core){

    return {
        // get application
        get: function(req, res, next){
            core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, req.params.application].join("::"), function(err, application){
                if(err && err.name == core.constants.myriad.ENOKEY)
                    res.stash.code = 404;
                else if(err)
                    res.stash.code = 400;
                else{
                    try{
                        core.applications.get_containers(req.params.application, function(err, containers){
                            if(err && err.name == core.constants.myriad.ENOKEY)
                                res.stash.code = 404;
                            else if(err)
                                res.stash.code = 400;
                            else{
                                application = JSON.parse(application);
                                application.containers = containers;
                                res.stash.code = 200;
                                res.stash.body = application;
                            }
                        });
                    }
                    catch(err){
                        res.stash.code = 400;
                    }
                }

                return next();
            });
        },

        // create application
        create: function(req, res, next){
            core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, req.params.application].join("::"), function(err, application){
                if(err && err.name == core.constants.myriad.ENOKEY){
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
                        "privileged",
                        "tags",
                        "volumes"
                    ]);

                    config.id = req.params.application;

                    core.applications.add(config, function(err){
                        if(err)
                            res.stash.code = 400;
                        else
                            res.stash.code = 201;

                        return next();
                    });
                }
                else if(err)
                    res.stash.code = 400;
                else{
                    res.stash.code = 400;
                    res.stash.body = { error: ["Application", req.params.application, "already exists"].join(" ") };
                    return next();
                }
            });
        },

        // update application
        update: function(req, res, next){
            core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, function(err, applications){
                if(err){
                    res.stash.code = 400;
                    return next();
                }

                if(!_.contains(applications, [core.constants.myriad.APPLICATION_PREFIX, req.params.application].join("::"))){
                    res.stash.code = 404;
                    return next();
                }

                var body = {
                    id: req.params.application
                }

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
                if(_.has(req.body, "privileged"))
                    body.privileged = req.body.privileged;
                if(_.has(req.body, "respawn"))
                    body.respawn = req.body.respawn;
                if(_.has(req.body, "tags"))
                    body.tags = req.body.tags;
                if(_.has(req.body, "volumes"))
                    body.volumes = req.body.volumes;

                core.applications.add(body, function(err){
                    if(err){
                        res.stash.code = 400;
                        return next();
                    }

                    core.applications.redeploy_containers(req.params.application, function(err){
                        if(err)
                            res.stash.code = 400;
                        else
                            res.stash.code = 200;

                        return next();
                    });
                });
            });
        },

        // delete application
        delete: function(req, res, next){
            core.applications.remove(req.params.application, function(err){
                if(err && err.name == core.constants.myriad.ENOKEY)
                    res.stash.code = 404;
                else if(err)
                    res.stash.code = 400;
                else
                    res.stash.code = 204;

                return next();
            });
        },

        // get application containers
        get_containers: function(req, res, next){
            core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, req.params.application].join("::"), function(err, application){
                if(err && err.name == core.constants.myriad.ENOKEY)
                    res.stash.code = 404;
                else if(err)
                    res.stash.code = 400;
                else{
                    try{
                        core.applications.get_containers(req.params.application, function(err, containers){
                            if(err && err.name == core.constants.myriad.ENOKEY)
                                res.stash.code = 404;
                            else if(err)
                                res.stash.code = 400;
                            else{
                                application = JSON.parse(application);
                                res.stash.body = containers;
                                res.stash.code = 200;
                            }
                        });
                    }
                    catch(err){
                        res.stash.code = 400;
                    }
                }

                return next();
            });
        },

        // get application container
        get_container: function(req, res, next){
            core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, req.params.application].join("::"), function(err, application){
                if(err && err.name == core.constants.myriad.ENOKEY)
                    res.stash.code = 404;
                else if(err)
                    res.stash.code = 400;
                else{
                    try{
                        core.applications.get_container(req.params.application, req.params.container, function(err, container){
                            if(err && err.name == core.constants.myriad.ENOKEY)
                                res.stash.code = 404;
                            else if(err)
                                res.stash.code = 400;
                            else{
                                application = JSON.parse(application);
                                res.stash.body = _.defaults(container, application);
                                res.stash.code = 200;
                            }
                        });
                    }
                    catch(err){
                        res.stash.code = 400;
                    }
                }

                return next();
            });
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
                    core.applications.deploy_container(req.params.application, _.cloneDeep(body), function(err){
                        if(err)
                            errors++;

                        return fn();
                    });
                }, function(){
                    if(errors > 0){
                        res.stash.code = 400;
                        res.stash.body = {
                            error: {
                                failed: errors,
                                success: req.query.count - errors
                            }
                        }
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
                core.applications.remove_containers(req.params.application, _.parseInt(req.query.count), function(err){
                    if(err){
                        res.stash = {
                            code: 400,
                            body: {
                                error: err.message
                            }
                        }
                    }
                    else
                        res.stash.code = 204;

                    return next();
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
            core.applications.remove_container(req.params.application, req.params.container, function(err){
                if(err && err.name == core.constants.myriad.ENOKEY)
                    res.stash.code = 404;
                else if(err)
                    res.stash.code = 400;
                else
                    res.stash.code = 204;

                return next();
            });
        }
    }

}
