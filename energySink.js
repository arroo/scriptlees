/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('energySink');
 * mod.thing == 'a thing'; // true
 */

var cat = function (arr, el) {
    arr.push(el);
    return arr;
}

var findNearestSink = function (creep) {
    var sinks = [];
    sinks = creep.room.find(FIND_MY_STRUCTURES, {filter:function (structure) {
        switch (structure.structureType) {
            case STRUCTURE_EXTENSION:
            case STRUCTURE_SPAWN:
                break;
            default:
                return false;
        }
        return structure.energy < structure.energyCapacity;
    }}).reduce(cat, sinks);
    console.log('my structure sinks:', sinks);
    sinks = creep.room.find(FIND_STRUCTURES, {filter:{structureType:STRUCTURE_CONTAINER}}).filter(function (structure) {
        return structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
    }).reduce(cat,sinks);
    
    if (sinks.length > 1) {
        sinks.filter(function(structure) {return structure.id !== creep.memory.source});
    }
    return creep.pos.findClosestByPath(sinks);
    
}

var sinkEnergy = function (creep) {

    var sink;
    if (creep.memory.sink) {
        sink = Game.getObjectById(creep.memory.sink);
    }

    if (!sink || sink === creep.memory.source || sink.structureType === STRUCTURE_CONTAINER && sink.store[RESOURCE_ENERGY] >= sink.storeCapacity || sink.structureType !== STRUCTURE_CONTAINER && sink.energy >= sink.energyCapacity) {
        sink = findNearestSink(creep);
        if (!sink)return;
        creep.memory.sink = sink.id;
    }
    
    var xfer = creep.transfer(sink, RESOURCE_ENERGY);
    if(xfer == ERR_NOT_IN_RANGE) {
                creep.moveTo(sink);
    } else if (xfer !== OK) {
        
        console.log('creep ' + creep.name + ' unable to give to sink:' + xfer + ':', sink);
    }
}

module.exports = sinkEnergy;