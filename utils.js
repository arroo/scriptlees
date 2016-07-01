/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils');
 * mod.thing == 'a thing'; // true
 */
var findClosestEmptyAdjacent = function (pos) {
    
}
var strerror = function (errno) {
    
    switch (errno) {
        case ERR_NOT_OWNER:

            return 'you are not the owner';
        case ERR_NO_PATH:

            return 'there is no path to the target';
        case ERR_BUSY:
            return 'busy';

        case ERR_NOT_FOUND:
            return 'not found';

        case ERR_NOT_ENOUGH_ENERGY:
            return 'not enough energy/resources/extensions';

        case ERR_INVALID_TARGET:
            return 'invalid target';

        case ERR_FULL:
            return 'full';

        case ERR_NOT_IN_RANGE:
            return 'not in range';

        case ERR_INVALID_ARGS:
            return 'invalid arguments';

        case ERR_TIRED:
            return 'tired';

        case ERR_NO_BODYPART:
            return 'no matching bodypart';

        case ERR_NOT_ENOUGH_EXTENSIONS:
            return 'not enough extensions';

        case ERR_RCL_NOT_ENOUGH:
            return 'not enough RCL';

        case ERR_GCL_NOT_ENOUGH:
            return 'not enough GCL';

        default:
            return 'unknown error: ' + errno;
        
    }
}

module.exports = {
    'strerror': strerror
};