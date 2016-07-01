require('CreepFactory');
var PriorityQueue = require('pqueue');
var utils = require('utils');
var strerror = utils.strerror;

var BUILDING = 0;
var UPGRADING = 1;
var FILLING = 2;

var cat = function (arr, el) {
    arr.push(el);
    return arr;
}

var findNearestSource = function (pos) {
    var room = Game.rooms[pos.roomName];
    var sources = [];
    sources = room.find(FIND_SOURCES).reduce(cat, sources);
    sources = room.find(FIND_DROPPED_RESOURCES).reduce(cat, sources);
    //sources = room.find(FIND_STRUCTURES, {filter:function(structure){return structure.structureType===STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY]}}).reduce(cat, sources);
    
    return pos.findClosestByPath(sources);
}

Spawn.prototype.makeHarvester = function (init) {
    init = init || {};
    var mem = init.mem || {};
    mem.pq = init.pq;
    mem.run = 'gotoThen';
    mem.state = FILLING;
    mem.genesis = 'makeHarvester';

    var destinationInfo = {
        'range': 1,
        'then': 'fillHarvester'
    };
    
    var target = findNearestSource(this.pos);
    destinationInfo.target = target.pos;
    destinationInfo.source = target.id;
    
    mem.destination = destinationInfo;

    var body = [MOVE, WORK, CARRY]; // bare minimum creep body definition
    var extras = [];
    var bonus = [];
    var extraBonus = [MOVE, WORK, MOVE, CARRY];
    
    return this.CreepFactory(body, mem, extras, bonus, extraBonus);
}

Creep.prototype.movingTargetHarvester2 = function () {
    
}

Creep.prototype.movingTargetHarvester = function () {
    var creep = this;
    var target;
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
    
    target = creep.pos.findClosestByPath(sinks);

    if (!target) {
        //console.log('builder found moving target: controller')
        creep.memory.destination.then = 'upgraderHarvester';
        creep.memory.destination.range = 3;
        target = creep.room.controller;
    } else {
        creep.memory.site = target.id;
        creep.memory.destination.then = 'runHarvester';
        creep.memory.destination.range = 1;
    }
    
    return target.pos;
}

Creep.prototype.fillHarvester = function () {
    var creep = this;
    var source = Game.getObjectById(creep.memory.destination.source);
    if (_.sum(creep.carry) >= creep.carryCapacity || !source) {
        creep.say('full');
        creep.memory.destination.movingTarget = 'movingTargetHarvester';
        creep.memory.destination.then = 'runHarvester';
        creep.setAndRun('gotoThen');
        return;
    }
    
    
    var res;
    switch (source.structureType) {
        case STRUCTURE_CONTAINER:
        case STRUCTURE_STORAGE:
            res = source.transfer(creep, RESOURCE_ENERGY);
            break;
        default:
            break;
    }
    if (typeof res === 'undefined') {
        if (source.resourceType===RESOURCE_ENERGY) {
            res = creep.pickup(source);
        } else if (source.energy) {
            res = creep.harvest(source);
        } else {
        }
    }
    if (res !== OK) {
        console.log('error filling harvester ' + creep.name + ':' + strerror(res));
    }
}

Creep.prototype.upgraderHarvester = function () {
    var creep = this;
    if (_.sum(creep.carry) <= 0) {
        creep.say('empty');
        delete creep.memory.destination.movingTarget;
        var source = findNearestSource(creep.pos);
        if (!source) {
            return;
        }
        creep.memory.destination.target = source.pos;
        creep.memory.destination.source = source.id;
        creep.memory.destination.then ='fillHarvester';
        creep.memory.destination.range = 1;
        creep.setAndRun('gotoThen');
        return;
    }
    
    var controller = creep.room.controller;
    
    var res = creep.upgradeController(controller);
    if (res !== OK) {
        console.log('harvester ' + creep.name + ' unable to upgrade room ' + creep.room.name + ':' + strerror(res));
        delete creep.memory.destination.movingTarget;
        creep.memory.destination.then = 'fillHarvester';
        creep.setAndRun('gotoThen');
    }
}

Creep.prototype.runHarvester = function () {
    var creep = this;
    var res;
    var site = Game.getObjectById(creep.memory.site);

    if (_.sum(creep.carry) <= 0 || !site || site.energy >= site.energyCapacity) {
        delete creep.memory.destination.movingTarget;
        var source = findNearestSource(creep.pos);
        creep.memory.destination.target = source.pos;
        creep.memory.destination.source = source.id;
        creep.memory.destination.then = 'fillHarvester';
        creep.memory.destination.range = 1;
        creep.setAndRun('gotoThen');
        return;
    }

    res = creep.transfer(site, RESOURCE_ENERGY);
    if (res !== OK) {
        console.log('harvester ' + creep.name + 'cannot transfer to site:' + site.id + ':' +strerror(res));
    } else {
        creep.memory.pq = new PriorityQueue(creep.memory.pq).queue(0, site.id);
    }
    
    return;
}

module.exports = {};