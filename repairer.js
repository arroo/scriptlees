/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('repairer');
 * mod.thing == 'a thing'; // true
 */

require('CreepFactory');
//var PriorityQueue = require('pqueue');
var utils = require('utils');
var strerror = utils.strerror;
//var cat = utils.cat;

var REPAIRING = 0;
var UPGRADING = 1;
var FILLING = 2;

Spawn.prototype.makeRepairer = function (init) {
	//init = init || {};
	var mem = {};
	mem.run = 'startRepairer';
	mem.genesis = 'makeRepairer';
	mem.resource = RESOURCE_ENERGY;

	var body = [MOVE, WORK, CARRY]; // bare minimum creep body definition
	var extras = [];
	var bonus = [];
	var extraBonus = [MOVE, WORK, MOVE, CARRY];
	
	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.startRepairer = function () {
	var creep = this;

	var target = creep.pos.findNearestSource(RESOURCE_ENERGY, creep.carryCapacity);

	if (target) {
		creep.memory.state = FILLING;
		creep.memory.target = target.id;
		creep.setGoing(target, 'fillRepairer', 1, 'movingTargetRepairer');
	} else {
		console.log(creep.memory.genesis + ' ' + creep.name + ' cannot find a ' + RESOURCE_ENERGY + ' source');
	}
};
RoomPosition.prototype.findNearestDamagedStructure = function () {
	var pos = this;

	var damagedStructureTests = [
		s => s.my,
		s => s.structureType !== STRUCTURE_WALL,
		s => s.structureType === STRUCTURE_WALL

	];

	var nearestDamagedStructure = pos.findNearestThing(function (room) {

		var damagedStructures = room.find(FIND_STRUCTURES, {filter : s => s.hits < s.hitsMax});
		var target = damagedStructureTests.reduce(function (target, filter) {
			if (target) {
				return target;
			}

			var damagedStructureTypes = damagedStructures.filter(filter);
			if (damagedStructureTypes.length) {
				return pos.findClosestByRange(damagedStructureTypes);
			}
		}, undefined);
		
		return target;
	}, undefined);

	return nearestDamagedStructure;
};

Creep.prototype.movingTargetRepairer = function () {
	var creep = this;

	var mem = creep.memory;

	var target = Game.getObjectById(mem.target);

	// make sure it's still a valid target
	if (target) {
		var neededResource = creep.carryCapacity - _.sum(creep.carry);
		var predicate = s => true;
		if (mem.state === REPAIRING && (target instanceof Structure || target.hits < target.hitsMax )) {
			predicate = s => s === creep.carryCapacity;

		} else if (target instanceof StructureContainer || target instanceof StructureStorage) {
			predicate = s => s > target.store[RESOURCE_ENERGY];

		} else if (target instanceof Resource) {
			predicate = s => s > target.amount;

		} else if (target instanceof Source) {
			predicate = s => s > target.energy;

		} else {
			console.log(mem.genesis + ' ' + creep.name + ' is going to an unplanned target:' + target.id + ', ', JSON.stringify(target));
		}

		if (predicate(neededResource)) {
			target = undefined;
		}
	}

	// target is gone/invalid, get a new one
	if (!target) {

		// check if nearest energy dump
		if (creep.carry[mem.resource]) {
			target = creep.pos.findNearestDamagedStructure();
			if (target) {
				creep.memory.state = REPAIRING;
				mem.destination.then = 'runRepairer';
			} else {
				creep.memory.state = UPGRADING;
				target = creep.pos.findNearestStructureTypes(STRUCTURE_CONTROLLER, true);
				mem.destination.then = 'upgraderRepairer';
			}

			mem.destination.range = 3;

		} else {
			target = creep.pos.findNearestSource(mem.resource, creep.carryCapacity - _.sum(creep.carry));
			if (target) {
				creep.memory.state = FILLING;
				mem.destination.then = 'fillRepairer';
				mem.destination.range = 1;
			}
		}
	}

	// if we still don't have a target, fuuuuck
	if (!target) {
		throw '' + mem.genesis + ' ' + creep.name + ' cannot find anywhere to go';
	}

	creep.memory.target = target.id;

	return target.pos;
};

Creep.prototype.fillRepairer = function () {
	var creep = this;
	var source = Game.getObjectById(creep.memory.target);

	// find a new one
	if (!source || _.sum(creep.carry) >= creep.carryCapacity) {
		delete creep.memory.target;
		creep.setAndRun('gotoThen');
		return;
	}

	var res = creep.takeResource(source, creep.memory.resource);
	if (res === ERR_NOT_ENOUGH_ENERGY) {
		delete creep.memory.target;
		creep.setAndRun('gotoThen');
	} else if (res !== OK) {
		console.log('error filling repairer ' + creep.name + ':' + strerror(res));
	}
};

Creep.prototype.upgraderRepairer = function () {
	var creep = this;
	var controller = Game.getObjectById(creep.memory.target);

	// find a new one
	var totalCarry = _.sum(creep.carry);
	if (!controller || totalCarry <= 0) {
		creep.memory.range = totalCarry ? 3 : 1;
		delete creep.memory.target;
		creep.setAndRun('gotoThen');
		return;
	}

	var res = creep.upgradeController(controller);
	if (res === ERR_NOT_ENOUGH_ENERGY) {
		creep.memory.range = 1;
		delete creep.memory.target;
		creep.setAndRun('gotoThen');
	} else if (res !== OK) {
		console.log('error repairer upgrading controller ' + creep.name + ':' + strerror(res));
	}
};

Creep.prototype.runRepairer = function () {
	var creep = this;
	var res;
	var site = Game.getObjectById(creep.memory.target);

	var totalCarry = _.sum(creep.carry);
	if (totalCarry <= 0 || !site || site.hits >= site.hitsMax) {
		creep.memory.range = totalCarry ? 3 : 1;
		delete creep.memory.target;
		creep.setAndRun('gotoThen');
		return;
	}

	res = creep.repair(site);
	if (res !== OK) {
		console.log('repairer ' + creep.name + 'cannot repair site:' + site.id + ':' + strerror(res));
	}

};

module.exports = {};