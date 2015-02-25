var _ = require("lodash");
var Server = require([__dirname, "lib", "server"].join("/"));

// define ContainershipAPI
function ContainershipAPI(){}

ContainershipAPI.prototype.load_options = function(options){
    this.options = options;
}

ContainershipAPI.prototype.load_core = function(core){
    core.logger.register("containership.api");
    this.server = new Server(core, this.options);
}

module.exports = ContainershipAPI;
