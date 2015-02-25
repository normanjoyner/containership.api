var _ = require("lodash");

module.exports = function(core){

    return {
        // get all hosts
        get: function(req, res, next){
            var body = core.hosts.get_all();
            _.each(_.keys(body), function(id){
                body[id].containers = core.hosts.get_containers(id);
            });

            res.stash = {
                code: 200,
                body: body
            }

            return next();
        }
    }

}
