'use strict';

const _ = require('lodash');

module.exports = function(core) {

    return {
        // get variable
        get(req, res, next) {
            return core.cluster.myriad.persistence.get([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), (err, value) => {
                if(err && err.name == core.constants.myriad.ENOKEY) {
                    res.stash.code = 404;
                } else if(err) {
                    res.stash.code = 400;
                } else {
                    res.stash = {
                        code: 200,
                        body: value
                    };
                }

                return next();
            });
        },

        // create variable
        create(req, res, next) {
            if(!_.has(req.body, 'value')) {
                res.stash = {
                    code: 400,
                    body: {
                        error: 'Missing \'value\' field!'
                    }
                };

                return next();
            }

            return core.cluster.myriad.persistence.get([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), (err/*, value*/) => {
                if(err && err.name == core.constants.myriad.ENOKEY) {
                    return core.cluster.myriad.persistence.set([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), req.body.value, (err) => {
                        if(err) {
                            res.stash.code = 400;
                        } else {
                            res.stash.code = 201;
                        }
                        return next();
                    });
                } else if(err) {
                    res.stash.code = 400;
                    return next();
                } else {
                    res.stash = {
                        code: 400,
                        body: {
                            error: 'Variable already exists!'
                        }
                    };

                    return next();
                }
            });
        },

        // update variable
        update(req, res, next) {
            if(!_.has(req.body, 'value')) {
                res.stash = {
                    code: 400,
                    body: {
                        error: 'Missing \'value\' field!'
                    }
                };

                return next();
            }

            return core.cluster.myriad.persistence.get([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), (err/*, value*/) => {
                if(err && err.name == core.constants.myriad.ENOKEY) {
                    res.stash.code = 404;
                    return next();
                } else if(err) {
                    res.stash.code = 400;
                    return next();
                }

                return core.cluster.myriad.persistence.set([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), req.body.value, (err) => {
                    if(err) {
                        res.stash.code = 400;
                    } else {
                        res.stash.code = 200;
                    }
                    return next();
                });

            });
        },

        // delete variable
        delete(req, res, next) {
            return core.cluster.myriad.persistence.delete([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), (err/*, value*/) => {
                if(err && err.name == core.constants.myriad.ENOKEY) {
                    res.stash.code = 404;
                } else if(err) {
                    res.stash.code = 400;
                } else {
                    res.stash.code = 204;
                }
                return next();
            });
        }
    };

};
