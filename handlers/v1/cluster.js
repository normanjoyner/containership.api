module.exports = function(core){

    return {
        // get cluster state
        get: function(req, res, next){
            res.stash = {
                code: 200,
                body: {
                    id: core.cluster_id
                }
            }

            return next();
        }
    }

}
