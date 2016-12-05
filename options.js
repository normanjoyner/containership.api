'use strict';

module.exports = {
    'api-interface': {
        help: 'Interface for API to listen on',
        metavar: 'INTERFACE',
        default: '0.0.0.0'
    },

    'api-port': {
        help: 'Port for API to listen on',
        metavar: 'PORT',
        default: '80'
    },

    'api-max-body-size': {
        help: 'Max request body size (mb)',
        metavar: 'BODY_SIZE',
        default: '1'
    }
};
