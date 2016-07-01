/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('flags');
 * mod.thing == 'a thing'; // true
 */
 
 

//var utils = require('utils');
var combos = {};
combos[RESOURCE_ENERGY] = [COLOR_GREEN, COLOR_YELLOW];

// role flags
combos['makeMelee'] = [COLOR_GREY, COLOR_RED];
combos['makeRanged'] = [COLOR_GREY, COLOR_BLUE];
combos['makeHealer'] = [COLOR_GREY, COLOR_GREEN];
combos['makeBuilder'] = [COLOR_GREY, COLOR_BROWN];
combos['makeRepairer'] = [COLOR_GREY, COLOR_CYAN];
combos['makeMiner'] = [COLOR_GREY, COLOR_YELLOW];
combos['makeCourier'] = [COLOR_GREY, COLOR_WHITE];
combos['makeUpgrader'] = [COLOR_GREY, COLOR_PURPLE];
combos['makeUnknown'] = [COLOR_GREY, COLOR_GREY];

var isSourceClosure = function (type) {
    var closure = function (flag) {
        return isSource(flag, type);
    }
    return closure;
}

var isSource = function (flag, type) {
    return combos[type] && flag.color === combos[type][0] && flag.secondaryColor === combos[type][1];
};

var isAnySource = function (flag) {
    return flag.color === COLOR_GREEN;
}

var makeSource = function (type, room, pos) {
    if (!combos[type]) {
        console.log('failed to make flag for ' + type);
        console.log(JSON.stringify(combos));
        return ERR_INVALID_ARGS;
    }
    
    return room.createFlag(pos, undefined, combos[type][0], combos[type][1]);
};

Creep.prototype.moveRoleFlag = function () {
    this.memory.flags = this.memory.flags || {};
    this.memory.flags.role = this.memory.flags.role || this.makeRoleFlag(this.name);
    var flag = Game.flags[this.memory.flags.role];
    
    if (_.isString(this.memory.flags.role)) {
        if (flag) {
            flag.setPosition(this.pos);
        }
    }
    
    if (this.memory.nextPos) {
        return flag.setPosition(new RoomPosition(this))
    }
}

Creep.prototype.makeRoleFlag = function (name) {
    var combo = combos[this.memory.genesis] || combos['makeUnknown'];
    
    var flag = this.pos.createFlag(name, combo[0], combo[1]);
    if (flag === ERR_NAME_EXISTS) {
        Game.flags[name].remove();
        return this.makeRoleFlag(name);
    } else if (flag !== OK) {
        return flag;
    }
    Game.flags[flag].memory.creep = this.id;
}

module.exports = {
    'makeSource': makeSource,
    'isSource': isSource,
    'isSourceClosure': isSourceClosure,
    'isAnySource': isAnySource,
};