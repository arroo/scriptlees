/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('courier');
 * mod.thing == 'a thing'; // true
 */

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
};

var findNearestSource = function (pos) {
    var room = Game.rooms[pos.roomName];
    var sources = [];
    //sources = room.find(FIND_SOURCES).reduce(cat, sources);
    sources = room.find(FIND_DROPPED_RESOURCES, {filter:{resourceType: RESOURCE_ENERGY}}).reduce(cat, sources);
    sources = room.find(FIND_STRUCTURES, {filter:function(structure){return structure.structureType===STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY]}}).reduce(cat, sources);
    
    sources = _.sortBy(sources, function (source) {
        var energy;
        
        if (source.store && source.store[RESOURCE_ENERGY]) {
            energy = source.store[RESOURCE_ENERGY];
        } else if (source.amount) {
            energy = source.amount;
        }
        
        return -energy;
    });
    
    var target = sources.reduce(function (obj, source) {
        if (Object.keys(obj).length) {
            return obj;
        }
        
        if (pos.findPath(source)) {
            return source;
        }
    }, {});
    
    return target;
};

Spawn.prototype.makeCourier = function (init) {
    init = init || {};
    var mem = {};
    mem.pq = init.pq;
    mem.run = 'gotoThen';
    mem.state = FILLING;
    mem.genesis = 'makeCourier';

    var destinationInfo = {
        'range': 1,
        'then': 'fillCourier'
    };
    
    var target = findNearestSource(this.pos);
    destinationInfo.target = target.pos;
    destinationInfo.source = target.id;
    
    mem.destination = destinationInfo;

    var body = [MOVE, CARRY]; // bare minimum creep body definition
    var extras = [MOVE, CARRY, MOVE, CARRY];
    var bonus = [];
    var extraBonus = [MOVE, CARRY];
    
    return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.movingTargetCourier2 = function () {
    
};

Creep.prototype.movingTargetCourier = function () {
    var creep = this;
    var target;
    var sinks = [];
    sinks = creep.room.find(FIND_MY_STRUCTURES, {filter:function (structure) {
        switch (structure.structureType) {
            case STRUCTURE_EXTENSION:
            case STRUCTURE_SPAWN:
            case STRUCTURE_TOWER:
                break;
            default:
                return false;
        }
        return structure.energy < structure.energyCapacity;
    }}).reduce(cat, sinks);
    
    target = creep.pos.findClosestByPath(sinks);

	// try to find a construction site to dump into a container near
	if (!target) {
		var site = creep.room.find(FIND_MY_CONSTRUCTION_SITES).sort(s => s.progressTotal / s.progress)[0];

		if (site) {
			target = site.pos.findClosestByRange(FIND_STRUCTURES, {filter: s => s.structureType === STRUCTURE_CONTAINER && s.id !== creep.memory.destination.source && _.sum(s.store) + creep.carry[RESOURCE_ENERGY] <= s.storeCapacity });
		}
	}

    if (!target) {
        //console.log('builder found moving target: controller')
        creep.memory.destination.then = 'upgradeCourier';
        creep.memory.destination.range = 3;



        target = creep.room.find(FIND_MY_CONSTRUCTION_SITES)[0];
    } else {
        creep.memory.site = target.id;
        creep.memory.destination.then = 'runCourier';
        creep.memory.destination.range = 1;
    }
    
    if (!target) {
        return;
    }
    return target.pos;
};

Creep.prototype.waitCourier = function () {
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
    
    if (target) {
        creep.memory.site = target.id;
        creep.memory.destination.then = 'runCourier';
        creep.memory.destination.range = 1;
        creep.setAndRun('gotoThen');
        
    } else {
        creep.say('all full');
    }
};

Creep.prototype.fillCourier = function () {
    var creep = this;
    var source = Game.getObjectById(creep.memory.destination.source);
    if (_.sum(creep.carry) >= creep.carryCapacity || !source) {
        creep.say('full');
        creep.memory.destination.movingTarget = 'movingTargetCourier';
        creep.memory.destination.then = 'runCourier';
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
    if (res === ERR_NOT_ENOUGH_ENERGY) {
        creep.say('empty');
        delete creep.memory.destination.movingTarget;
        source = findNearestSource(creep.pos);
        if (!source) {
            return;
        }
        creep.memory.destination.target = source.pos;
        creep.memory.destination.source = source.id;
        creep.memory.destination.then ='fillCourier';
        creep.memory.destination.range = 1;
        creep.setAndRun('gotoThen');
    } else if (res !== OK) {
        console.log('error filling courier ' + creep.name + ':' + strerror(res));
    }
};

Creep.prototype.upgradeCourier = function () {
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
        creep.memory.destination.then ='fillCourier';
        creep.memory.destination.range = 1;
        creep.setAndRun('gotoThen');
        return;
    }
    
    var res = creep.drop(RESOURCE_ENERGY);
    if (res !== OK) {
        console.log('harvester ' + creep.name + ' unable to upgrade room ' + creep.room.name + ':' + strerror(res));
        delete creep.memory.destination.movingTarget;
        creep.memory.destination.then = 'fillCourier';
        creep.setAndRun('gotoThen');
    }
};

Creep.prototype.runCourier = function () {
    var creep = this;
    var res;
    var site = Game.getObjectById(creep.memory.site);

	var totalCarrying = _.sum(creep.carry);
    if (totalCarrying <= 0 || (!site || site.energy >= site.energyCapacity) && totalCarrying < 0.5 * creep.carryCapacity) {
        delete creep.memory.destination.movingTarget;
        var source = findNearestSource(creep.pos);
        if (!source) {
            return;
        }
        creep.memory.destination.target = source.pos;
        creep.memory.destination.source = source.id;
        creep.memory.destination.then = 'fillCourier';
        creep.memory.destination.range = 1;
        creep.setAndRun('gotoThen');
        return;
    }

	if (!site || site.energy >= site.energyCapacity) {
		creep.memory.destination.movingTarget = 'movingTargetCourier';
		creep.memory.destination.then = 'runCourier';
		creep.setAndRun('gotoThen');
		return;
	}

    res = creep.transfer(site, RESOURCE_ENERGY);
    if (res !== OK) {
        console.log('harvester ' + creep.name + 'cannot transfer to site:' + site.id + ':' +strerror(res));
    } else {
        //creep.memory.pq = new PriorityQueue(creep.memory.pq).queue(0, site.id);
    }
    
    
};

module.exports = {};