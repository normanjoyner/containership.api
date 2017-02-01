'use strict';

const _ = require('lodash');
const async = require('async');

module.exports = {
    // get application
    get(req, res, next) {
        const core = req.core;
        return core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, req.params.application].join(core.constants.myriad.DELIMITER), (err, application) => {
            if(err && err.name === core.constants.myriad.ENOKEY) {
                res.stash.code = 404;
                return next();
            } else if(err) {
                res.stash.code = 500;
                return next();
            }

            try {
                return core.applications.get_containers(req.params.application, (err, containers) => {
                    if(err && err.name === core.constants.myriad.ENOKEY)  {
                        res.stash.code = 404;
                    } else if(err) {
                        res.stash.code = 500;
                    } else {
                        application = JSON.parse(application);
                        application.containers = containers;
                        res.stash.code = 200;
                        res.stash.body = application;
                    }
                    return next();
                });
            } catch(err) {
                res.stash.code = 500;
                return next();
            }
        });
    },

    // create application
    create(req, res, next) {
        const core = req.core;
        return core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, req.params.application].join(core.constants.myriad.DELIMITER), (err/*, application*/) => {
            if(err && err.name == core.constants.myriad.ENOKEY) {
                const config = _.pick(req.body, [
                    'command',
                    'container_port',
                    'cpus',
                    'engine',
                    'env_vars',
                    'image',
                    'memory',
                    'network_mode',
                    'privileged',
                    'respawn',
                    'tags',
                    'volumes'
                ]);

                config.id = req.params.application;

                return core.applications.add(config, (err, application) => {
                    if(err) {
                        res.stash.code = 400;
                        return next();
                    }

                    res.stash.code = 200;
                    res.stash.body = application;
                    return next();
                });
            } else if(err) {
                res.stash.code = 500;
            } else {
                res.stash.code = 400;
                res.stash.body = { error: `Application ${req.params.application} already exists` };
                return next();
            }
        });
    },

    // update application
    update(req, res, next) {
        const core = req.core;
        return core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, (err, applications) => {
            if(err) {
                res.stash.code = 500;
                return next();
            }

            if(!_.includes(applications, [core.constants.myriad.APPLICATION_PREFIX, req.params.application].join(core.constants.myriad.DELIMITER))) {
                res.stash.code = 404;
                return next();
            }

            const body = {
                id: req.params.application
            };

            if(_.has(req.body, 'command')) {
                body.command = req.body.command;
            }
            if(_.has(req.body, 'container_port')) {
                body.container_port = req.body.container_port;
            }
            if(_.has(req.body, 'cpus')) {
                body.cpus = req.body.cpus;
            }
            if(_.has(req.body, 'engine')) {
                body.engine = req.body.engine;
            }
            if(_.has(req.body, 'env_vars')) {
                body.env_vars = req.body.env_vars;
            }
            if(_.has(req.body, 'health_checks')) {
                body.health_checks = req.body.health_checks;
                const health_check_defaults = {
                    interval: 30000,
                    healthy_threshold: 1,
                    unhealthy_threshold: 3,
                    timeout: 5000,
                    type: 'tcp'
                };

                _.each(body.health_checks, (health_check) => {
                    _.defaults(health_check, health_check_defaults);
                });
            }
            if(_.has(req.body, 'image')) {
                body.image = req.body.image;
            }
            if(_.has(req.body, 'memory')) {
                body.memory = req.body.memory;
            }
            if(_.has(req.body, 'network_mode')) {
                body.network_mode = req.body.network_mode;
            }
            if(_.has(req.body, 'privileged')) {
                body.privileged = req.body.privileged;
            }
            if(_.has(req.body, 'respawn')) {
                body.respawn = req.body.respawn;
            }
            if(_.has(req.body, 'tags')) {
                body.tags = req.body.tags;
            }
            if(_.has(req.body, 'volumes')) {
                body.volumes = req.body.volumes;
            }

            return core.applications.add(body, (err, application) => {
                if(err) {
                    res.stash.code = 400;
                    return next();
                }

                return core.applications.redeploy_containers(req.params.application, (err, deployed_containers) => {
                    if(err) {
                        res.stash.code = 400;
                        return next();
                    }

                    application.containers = deployed_containers;
                    res.stash.code = 200;
                    res.stash.body = application;
                    return next();
                });
            });
        });
    },

    // delete application
    delete(req, res, next) {
        const core = req.core;
        return core.applications.remove(req.params.application, (err) => {
            if(err && err.name == core.constants.myriad.ENOKEY) {
                res.stash.code = 404;
            } else if(err) {
                res.stash.code = 500;
            } else {
                res.stash.code = 204;
            }

            return next();
        });
    },

    // get application containers
    get_containers(req, res, next) {
        const core = req.core;
        return core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, req.params.application].join(core.constants.myriad.DELIMITER), (err, application) => {
            if(err && err.name == core.constants.myriad.ENOKEY) {
                res.stash.code = 404;
                return next();
            } else if(err) {
                res.stash.code = 500;
                return next();
            }

            try {
                return core.applications.get_containers(req.params.application, (err, containers) => {
                    if(err && err.name == core.constants.myriad.ENOKEY) {
                        res.stash.code = 404;
                    } else if(err) {
                        res.stash.code = 500;
                    } else {
                        application = JSON.parse(application);
                        res.stash.body = containers;
                        res.stash.code = 200;
                    }
                    return next();
                });
            } catch(err) {
                res.stash.code = 500;
                return next();
            }
        });
    },

    // get application container
    get_container(req, res, next) {
        const core = req.core;
        return core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, req.params.application].join(core.constants.myriad.DELIMITER), (err, application) => {
            if(err && err.name == core.constants.myriad.ENOKEY) {
                res.stash.code = 404;
                return next();
            } else if(err) {
                res.stash.code = 500;
                return next();
            }

            try {
                return core.applications.get_container(req.params.application, req.params.container, (err, container) => {
                    if(err && err.name == core.constants.myriad.ENOKEY) {
                        res.stash.code = 404;
                    } else if(err) {
                        res.stash.code = 500;
                    } else {
                        application = JSON.parse(application);
                        res.stash.body = _.defaults(container, application);
                        res.stash.code = 200;
                    }
                    return next();
                });
            } catch(err) {
                res.stash.code = 500;
                return next();
            }
        });
    },

    // create application container
    create_containers(req, res, next) {
        const core = req.core;
        if(_.has(req.query, 'count')) {
            const body = {};

            if(_.has(req.body, 'tags') && _.isObject(req.body.tags)) {
                body.tags = req.body.tags;
            }
            if(_.has(req.body, 'container_port') && _.isNumber(req.body.container_port)) {
                body.container_port = req.body.container_port;
            }
            if(_.has(req.body, 'host_port') && _.isNumber(req.body.host_port)) {
                body.host_port = req.body.host_port;
            }
            let errors = 0;

            return async.timesSeries(_.parseInt(req.query.count), (index, fn) => {
                core.applications.deploy_container(req.params.application, _.cloneDeep(body), (err) => {
                    if(err) {
                        errors++;
                    }
                    return fn();
                });
            }, () => {
                if(errors > 0) {
                    res.stash.code = 500;
                    res.stash.body = {
                        error: {
                            failed: errors,
                            success: req.query.count - errors
                        }
                    };
                } else {
                    res.stash.code = 201;
                }

                return next();
            });
        } else {
            res.stash.code = 400;
            res.stash.body = { error: 'Please provide the \'count\' query string with the number of containers to create!' };
            return next();
        }
    },

    // remove application containers
    remove_containers(req, res, next) {
        const core = req.core;
        if(_.has(req.query, 'count')) {
            return core.applications.remove_containers(req.params.application, _.parseInt(req.query.count), (err) => {
                if(err) {
                    res.stash = {
                        code: 500,
                        body: {
                            error: err.message
                        }
                    };
                } else {
                    res.stash.code = 204;
                }

                return next();
            });
        }

        res.stash.code = 400;
        res.stash.body = { error: 'Please provide the \'count\' query string with the number of containers to remove!' };
        return next();
    },

    // remove specific container
    remove_container(req, res, next) {
        const core = req.core;
        return core.applications.remove_container(req.params.application, req.params.container, (err) => {
            if(err && err.name == core.constants.myriad.ENOKEY) {
                res.stash.code = 404;
            } else if(err) {
                res.stash.code = 500;
            } else {
                res.stash.code = 204;
            }

            return next();
        });
    }
};
