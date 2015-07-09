var _ = require("lodash");

// register handlers
exports.register = function(server, middleware){
    // api get cluster state
    server.get("/:api_version/cluster", middleware.get_handler("cluster", "get"));

    // api get applications
    server.get("/:api_version/applications", middleware.get_handler("applications", "get"));

    // api create applications
    server.post("/:api_version/applications", middleware.get_handler("applications", "create"));

    // api get application
    server.get("/:api_version/applications/:application", middleware.get_handler("application", "get"));

    // api create application
    server.post("/:api_version/applications/:application", middleware.get_handler("application", "create"));

    // api update application
    server.put("/:api_version/applications/:application", middleware.get_handler("application", "update"));

    // api delete application
    server.delete("/:api_version/applications/:application", middleware.get_handler("application", "delete"));

    // api get application containers
    server.get("/:api_version/applications/:application/containers", middleware.get_handler("application", "get_containers"));

    // api create application container
    server.post("/:api_version/applications/:application/containers", middleware.get_handler("application", "create_containers"));

    // api delete application containers
    server.delete("/:api_version/applications/:application/containers", middleware.get_handler("application", "remove_containers"));

    // api get application container
    server.get("/:api_version/applications/:application/containers/:container", middleware.get_handler("application", "get_container"));

    // api delete application container
    server.delete("/:api_version/applications/:application/containers/:container", middleware.get_handler("application", "remove_container"));

    // api get hosts
    server.get("/:api_version/hosts", middleware.get_handler("hosts", "get"))

    // api get host
    server.get("/:api_version/hosts/:host", middleware.get_handler("host", "get"));

    // api update host
    server.put("/:api_version/hosts/:host", middleware.get_handler("host", "update"));

    // api delete host
    server.delete("/:api_version/hosts/:host", middleware.get_handler("host", "delete"));
}
