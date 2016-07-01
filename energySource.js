/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('energySource');
 * mod.thing == 'a thing'; // true
 */

var cat = function (arr, el) {
    arr.push(el);
    return arr;
}

var findNearestSource = function (creep) {
    
    var sources = [];
    sources = creep.room.find(FIND_SOURCES).reduce(cat, sources);
    sources = creep.room.find(FIND_DROPPED_RESOURCES).reduce(cat, sources);
    sources = creep.room.find(FIND_STRUCTURES, {filter:function(structure){return structure.structureType===STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY]}}).reduce(cat, sources);
    
    var closest;
    
    if (sources.length > 1) {
        sources = sources.filter(function(source) {return creep.memory.sink !== source.id});
    }
    
    closest = creep.pos.findClosestByPath(sources);
    
    if (!closest && creep.memory.sink) {
        closest = Game.getObjectById(creep.memory.sink);
    }
    
    console.log(sources);
    return closest;
}

var findSource = function(creep) {
    
    var source = findNearestSource(creep);
    if (!source) return;
    creep.memory.source = source.id;
    
    var xfer;
    switch (source.structureType) {
        case STRUCTURE_EXTENSION:
            xfer = source.transferEnergy(creep);
            break;
        case STRUCTURE_CONTAINER:
            xfer = source.transfer(creep, RESOURCE_ENERGY);
            break;
        default:
            xfer = creep.harvest(source);
            break;
    }
    if(xfer == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
    } else if (xfer !== OK) {
        
        console.log(creep.name + ' unable to harvest:', xfer + ':', source);
    }
}

module.exports = findSource;