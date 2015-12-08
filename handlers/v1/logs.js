var fs = require("fs");
var _ = require("lodash");
var Tail = require("tail").Tail;

module.exports = function(core){

    return {
        // get logs
        get: function(req, res, next){
            var valid_log_types = ["stderr", "stdout"];
            if(!_.contains(valid_log_types, req.params.log_type))
                return next();

            var file_path = [core.options["container-log-dir"], req.params.application, req.params.log_type].join("/");

            res.setHeader("Connection", "Transfer-Encoding");
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("Transfer-Encoding", "chunked");

            var log = fs.createReadStream(file_path);
            var tail = new Tail(file_path);

            log.on("data", function(line){
                res.write(line);
            });

            log.on("error", function(){
                res.end();
            });

            log.on("end", function(){
                tail.on("line", function(line){
                    res.write([line, "\n"].join(""));
                });

                tail.on("error", function(err){
                    res.end();
                });

                req.on("close", function(){
                    tail.unwatch();
                });
            });
        }
    }

}
