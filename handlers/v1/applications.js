'use strict';

const _ = require('lodash');
const async = require('async');

module.exports = function(core) {

    return {

        // get applications
        get(req, res, next) {
            res.stash = {
                body: {},
                code: 200
            };

            return core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, (err, applications) => {
                if(err) {
                    return next();
                }

                return async.each(applications, (application_name, fn) => {
                    return core.cluster.myriad.persistence.get(application_name, (err, application) => {
                        if(err) {
                            return fn();
                        }

                        try {
                            application = JSON.parse(application);
                            return core.applications.get_containers(application.id, (err, containers) => {
                                if(err) {
                                    return fn();
                                }

                                application.containers = containers;
                                res.stash.body[application.id] = application;
                                return fn();
                            });
                        } catch(err) {
                            return fn();
                        }
                    });
                }, next);
            });
        },

        // create applications
        create(req, res, next) {
            if(!_.isUndefined(req.body)) {
                let all_applications = null;

                return async.series([
                    (fn) => {
                        return core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, (err, applications) => {
                            if(err) {
                                return fn();
                            }

                            applications = _.map(applications, (application) => {
                                return _.last(application.split(core.constants.myriad.DELIMITER));
                            });

                            all_applications = applications;

                            if(_.has(req.query, 'destroy') && req.query.destroy == 'true') {
                                all_applications = [];
                                return async.each(applications, (application_name, fn) => {
                                    core.applications.remove(application_name, fn);
                                }, fn);
                            } else {
                                return fn();
                            }
                        });
                    },
                    (fn) => {
                        return async.each(_.keys(req.body), (application_name, fn) => {
                            if(!_.contains(all_applications, application_name)) {
                                return core.applications.add(req.body[application_name], fn);
                            }

                            return fn();
                        }, fn);
                    }
                ], () => {
                    res.stash.code = 201;
                    return next();
                });
            }

            res.stash.code = 400;
            return next();
        }
    };

};
