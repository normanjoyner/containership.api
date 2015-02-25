var _ = require("lodash");

module.exports = function(core){

    return {
        // get host
        get: function(req, res, next){
            var body = core.hosts.get(req.params.host);
            body.containers = core.hosts.get_containers(req.params.host);
            res.stash.body = body;
            res.stash.code = 200;
            return next();
        },

        // update host
        update: function(req, res, next){
            if(!_.isUndefined(req.body) && _.has(req.body, "tags"))
                core.hosts.update(req.params.host, req.body.tags);

            res.stash.code = 200;
            return next();
        },

        // delete host
        delete: function(req, res, next){
            core.hosts.remove(req.params.host);
            res.stash.code = 204;
            return next();
        }
    }

}
