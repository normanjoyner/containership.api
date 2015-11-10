var _ = require("lodash");
var async = require("async");

module.exports = function(core){

    return {
        // get variable
        get: function(req, res, next){
            core.cluster.myriad.persistence.get([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), function(err, value){
                if(err && err.name == core.constants.myriad.ENOKEY)
                    res.stash.code = 404;
                else if(err)
                    res.stash.code = 400;
                else{
                    res.stash = {
                        code: 200,
                        body: value
                    }
                }

                return next();
            });
        },

        // create variable
        create: function(req, res, next){
            if(!_.has(req.body, "value")){
                res.stash = {
                    code: 400,
                    body: {
                        error: "Missing 'value' field!"
                    }
                }

                return next();
            }

            core.cluster.myriad.persistence.get([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), function(err, value){
                if(err && err.name == core.constants.myriad.ENOKEY){
                    core.cluster.myriad.persistence.set([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), req.body.value, function(err){

                        if(err)
                            res.stash.code = 400;
                        else
                            res.stash.code = 201;

                        return next();
                    });
                }
                else if(err){
                    res.stash.code = 400;
                    return next();
                }
                else{
                    res.stash = {
                        code: 400,
                        body: {
                            error: "Variable already exists!"
                        }
                    }

                    return next();
                }
            });
        },

        // update variable
        update: function(req, res, next){
            if(!_.has(req.body, "value")){
                res.stash = {
                    code: 400,
                    body: {
                        error: "Missing 'value' field!"
                    }
                }

                return next();
            }

            core.cluster.myriad.persistence.get([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), function(err, value){
                if(err && err.name == core.constants.myriad.ENOKEY){
                    res.stash.code = 404;
                    return next();
                }
                else if(err){
                    res.stash.code = 400;
                    return next();
                }
                else{
                    core.cluster.myriad.persistence.set([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), req.body.value, function(err){
                        if(err)
                            res.stash.code = 400;
                        else
                            res.stash.code = 200;

                        return next();
                    });
                }
            });
        },

        // delete variable
        delete: function(req, res, next){
            core.cluster.myriad.persistence.delete([core.constants.myriad.VARIABLES_PREFIX, req.params.variable].join(core.constants.myriad.DELIMITER), function(err, value){
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
