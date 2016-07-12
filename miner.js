/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('miner');
 * mod.thing == 'a thing'; // true
 */

require('CreepFactory');
var utils = require('utils');

var WALKING = 0;
var MINING = 1;
var DROPPING = 2;

Spawn.prototype.makeMiner = function (init) {
	init = init || {};
	var mem = {};
	mem.flag = init.flag;
	mem.run = 'startMiner';
	mem.state = MINING;
	mem.genesis = 'makeMiner';

	var flag = Game.flags[mem.flag];
	if (flag) {
		mem.room = flag.pos.roomName;
	} else if (Memory.flags[mem.flag] && Memory.flags[mem.flag].room) {
		mem.room = Memory.flags[mem.flag].room
	} else if (init.room) {
		mem.room = init.room
	}


	var body = [MOVE, WORK]; // bare minimum creep body definition
	var extras = [WORK, WORK, WORK, WORK];
	var bonus = [MOVE, MOVE, MOVE, MOVE];
	var extraBonus = [];
	
	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.startMiner = function () {

	var creep = this;
	var mem = creep.memory;
	var movingTarget;
	var target;
	var range;
	var flag = Game.flags[mem.flag];
	try {
		var spots = flag.room.openSpotsNear(flag);//flag.room.memory.sourceFlags[init.flag].adjacent;
		var spawn = flag.pos.findNearestFriendlySpawn();
		target = spots.reduce(function (pos, spot) {
				if (pos) {
					return pos;
				}

				var isContainer = function (dobj) {
					return dobj && dobj.structureType && dobj.structureType === STRUCTURE_CONTAINER;
				};

				var pos2 = new RoomPosition(spot.x, spot.y, spot.roomName);

				if (pos2.lookFor(LOOK_STRUCTURES).filter(isContainer).length) {
					return spot;
				}

				if (pos2.lookFor(LOOK_CONSTRUCTION_SITES).filter(isContainer).length) {
					return spot;
				}

				return pos;

			}, undefined) ||
		spawn.pos.findClosestByRange(spots) ||
		flag.room.find(Map.findExit(creep.room, flag.room))[0].findClosestByRange(spots);

		range = 0;
		mem.room = flag.room.name;

	} catch (err) {
		
		if (mem.room) {
			target = new RoomPosition(25, 25, mem.room);
			range = 0;
			movingTarget = 'movingTargetMiner';
		}
	}


	if (target) {
		mem.target = target;
		creep.setGoing(target, 'runMiner', range, movingTarget);
	} else {
		creep.log('cannot begin mining at flag ' + mem.flag);
	}
};

Creep.prototype.movingTargetMiner = function () {
	var creep = this;
	var mem = creep.memory;
	var flag = Game.flags[mem.flag];
	var target;
	if (flag && flag.room.name === creep.room.name) {
		var spots = flag.room.openSpotsNear(flag);
		var spawn = flag.pos.findNearestFriendlySpawn();
		target = spots.reduce(function (pos, spot) {
			if (pos) {
				return pos;
			}

			var isContainer = function (dobj) {
				return dobj && dobj.structureType && dobj.structureType === STRUCTURE_CONTAINER;
			};

			var pos2 = new RoomPosition(spot.x, spot.y, spot.roomName);

			if (pos2.lookFor(LOOK_STRUCTURES).filter(isContainer).length) {
				return spot;
			}

			if (pos2.lookFor(LOOK_CONSTRUCTION_SITES).filter(isContainer).length) {
				return spot;
			}

			return pos;

		}, undefined) || spawn.pos.findClosestByRange(spots) ||flag.room.find(Map.findExit(creep.room, flag.room))[0].findClosestByRange(spots);
		if (target) {
			delete creep.memory.destination.movingTarget;
			creep.memory.destination.target = target;
		}
	} else {
		target = mem.target;
		target = new RoomPosition(target.x, target.y, target.roomName);
	}

	return target;
};

Creep.prototype.runMiner = function() {
	var creep = this;
	var res;
	var mem = creep.memory;
	// Walk to predefined energy source
	var flag = Game.flags[creep.memory.flag];
	var source = Game.getObjectById(flag.room.memory.sourceFlags[flag.name].source);
	
	flag.room.memory.sourceFlags[flag.name].miner = creep.id;
//    var adjacent = flag.room.memory.sourceFlags[flag.name].adjacent;
//    adjacent = new RoomPosition(adjacent.x, adjacent.y, flag.room.name);
//    if (creep.memory.state === WALKING) {
//        if (creep.pos.isEqualTo(adjacent)) {
//            creep.memory.state = MINING;
//
//        } else {
//            creep.moveTo(adjacent, {'reusePath':0});
//            return;
//        }
//    }

	var spawn;
	if (!creep.memory.spawn || !Game.getObjectById(creep.memory.spawn)) {
		spawn = creep.pos.findNearestFriendlySpawn();
		if (spawn) {
			creep.memory.spawn = spawn.id;
		}
	}

	spawn = Game.getObjectById(creep.memory.spawn);
	if (spawn) {
		var rangeToSpawn = creep.pos.getRangeTo(spawn);
		if (rangeToSpawn === Infinity) rangeToSpawn = 100;
		var estimatedTickCost = creep.body.length * CREEP_SPAWN_TIME;
		var ticksToReplace = rangeToSpawn + estimatedTickCost;
		if (creep.ticksToLive <= ticksToReplace && !mem.signalledDemise) {
			var init = {};
			init.flag = mem.flag;
			creep.log('signalling respawn to spawn ' + spawn.name);
			creep.signalRespawn(init, spawn);
		}
	}

	// put down a construction site if needed
	if (!creep.pos.lookFor(LOOK_STRUCTURES).filter(function (structure) {return structure.structureType===STRUCTURE_CONTAINER}).length) {
		creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
	}
	// mine energy
	if ((!creep.carryCapacity || _.sum(creep.carry) < creep.carryCapacity) && creep.memory.state === MINING) {
		res = creep.harvest(source);
		if (res !== OK) {
			console.log('miner ' + creep.name + ' unable to mine:' + utils.strerror(res));
		}
		creep.drop(RESOURCE_ENERGY);
		return;
	}
	creep.memory.state = DROPPING;
	// build construction site if on it
	var containerSite = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).filter(function (structure) {return structure.structureType===STRUCTURE_CONTAINER});
	if (containerSite.length) {
		creep.build(containerSite[0]);
		
	} else {
		// drop energy into container
		creep.drop(RESOURCE_ENERGY);
	}
	
	if (_.sum(creep.carry) <= 0) {
		creep.memory.state = MINING;
	}
};

module.exports = {};