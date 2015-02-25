var ContainershipAPI = require([__dirname, "containership-api"].join("/"));
var pkg = require([__dirname, "package"].join("/"));
var options = require([__dirname, "options"].join("/"));

// instantiate new Containership API
module.exports = function(){
    var api = new ContainershipAPI();
    api.version = pkg.version;
    api.options = options;
    return api;
}
