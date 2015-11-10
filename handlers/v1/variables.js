var _ = require("lodash");
var async = require("async");

module.exports = function(core){

    return {
        // get all variables
        get: function(req, res, next){
            var vars = {};

            core.cluster.myriad.persistence.keys(core.constants.myriad.VARIABLES, function(err, variables){
                async.each(variables, function(variable_name, fn){
                    core.cluster.myriad.persistence.get(variable_name, function(err, value){
                        if(err)
                            return fn();

                        variable_name = _.last(variable_name.split(core.constants.myriad.DELIMITER));
                        vars[variable_name] = value;

                        return fn();
                    });
                }, function(err){
                    if(err){
                        res.stash.code = 400;
                        return fn();
                    }
                    else{
                        res.stash.code = 200;
                        res.stash.body = vars;

                        return next();
                    }
                });
            });
        }
    }

}
