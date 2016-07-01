/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('CreepFactory');
 * mod.thing == 'a thing'; // true
 */

Spawn.prototype.CreepFactory = function (body, mem, extras, bonus, extraBonus) {
    
    extras = extras || [];
    bonus = bonus || [];
    extraBonus = extraBonus || [];
    
    var bodyCost = function (body) {
        return body.reduce(function (total, part) {return total + BODYPART_COST[part]}, 0);
    }
    
    // add as many parts as room will allow
    while (extras.length && bodyCost(body) < this.room.energyCapacityAvailable && body.length < MAX_CREEP_SIZE) {
        body.push(extras.pop());
    }
    
    // add as many parts as current energy stores will allow
    while (bonus.length && bodyCost(body) < this.room.energyAvailable && body.length < MAX_CREEP_SIZE) {
        body.push(bonus.pop());
    }
    
    // add bonus parts repeatedly as current energy stores will allow
    var i = 0;
    while (extraBonus.length && bodyCost(body) < this.room.energyAvailable && body.length < MAX_CREEP_SIZE) {
        body.push(extraBonus[i]);
        i = (i + 1) % extraBonus.length;
    }
    
    // make sure room can support this creep
    if (bodyCost(body) > this.room.energyCapacityAvailable && body.length < MAX_CREEP_SIZE) {
        body.pop();
    }
    
    return this.createCreep(body, undefined, mem);
}

module.exports = {};