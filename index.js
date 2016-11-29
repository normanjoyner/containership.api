'use strict';

const ContainershipAPI = require('./containership-api');
const options = require('./options');
const pkg = require('./package');

// instantiate new Containership API
module.exports = function() {
    const api = new ContainershipAPI();
    api.version = pkg.version;
    api.options = options;
    return api;
};
