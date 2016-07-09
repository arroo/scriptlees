require('CreepFactory');
var PriorityQueue = require('pqueue');
var utils = require('utils');
var strerror = utils.strerror;
var flags = require('flags');
var cat = utils.cat;

var BUILDING = 0;
var UPGRADING = 1;
var FILLING = 2;


Spawn.prototype.makeUpgrader = function (init) {
	init = init || {};
	var mem = {};

	mem.resource = init.resource || RESOURCE_ENERGY;
	mem.run = 'startUpgrader';
	mem.genesis = 'makeUpgrader';
	mem.room = init.room;


	var body = [MOVE, WORK, CARRY]; // bare minimum creep body definition
	var extras = [MOVE, WORK, CARRY];
	var bonus = [MOVE, WORK, CARRY];
	var extraBonus = [MOVE, WORK, MOVE, CARRY];

	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.startUpgrader = function () {
	var creep = this;
	var resource = creep.memory.resource;

	var target = creep.pos.findNearestSource(resource, creep.carryCapacity);

	if (target) {
		creep.memory.target = target.id;
		creep.setGoing(target, 'fillUpgrader', 1, 'movingTargetUpgrader');
	} else {
		creep.log('cannot find a ' + creep.memory.resource + ' source');
	}
};

Creep.prototype.movingTargetUpgrader = function () {
	var creep = this;
	this.basicCreepRespawn({'room':creep.memory.room});
	var mem = creep.memory;

	var target = Game.getObjectById(mem.target);
	var neededResource = creep.carryCapacity - creep.carry[RESOURCE_ENERGY];
	// make sure it's still a valid target
	if (target) {

		var predicate = s => true;
		if (target instanceof StructureController) {
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
		var room = Game.rooms[creep.memory.room];

		if (creep.carry[RESOURCE_ENERGY] <= 0) {
			target = creep.pos.findNearestSource(RESOURCE_ENERGY, creep.carryCapacity, false);
			creep.memory.destination.range = 1;
			creep.memory.destination.then = 'fillUpgrader';

		} else if (room && creep.room.name === room.name) {
			target = room.controller;
			creep.memory.destination.range = 3;
			creep.memory.destination.then = 'runUpgrader';
		} else {
			target = {};
			target.pos = new RoomPosition(25, 25, creep.memory.room);
		}
	}

	// if we still don't have a target, fuuuuck
	if (!target) {
		throw '' + mem.genesis + ' ' + creep.name + ' cannot find anywhere to go';
	}

	creep.memory.target = target.id;

	return target.pos;
};

Creep.prototype.fillUpgrader = function () {
	var creep = this;
	var source = Game.getObjectById(creep.memory.target);
	this.basicCreepRespawn({'room':creep.memory.room});
	// find a new one
	if (!source || _.sum(creep.carry) >= creep.carryCapacity) {
		delete creep.memory.target;
		creep.setRun('gotoThen');
		return;
	}

	var res = creep.takeResource(source, creep.memory.resource);
	if (res === ERR_NOT_ENOUGH_ENERGY) {
		delete creep.memory.target;
		creep.setRun('gotoThen');
	} else if (res !== OK) {
		console.log('error filling upgrader ' + creep.name + ':' + strerror(res));
	}
};

Creep.prototype.runUpgrader = function () {
	var creep = this;
	var controller = Game.getObjectById(creep.memory.target);
	this.basicCreepRespawn({'room':creep.memory.room});
	// find a new one
	var totalCarry = _.sum(creep.carry);
	if (!controller || totalCarry <= 0) {
		creep.memory.range = totalCarry ? 3 : 1;
		delete creep.memory.target;
		creep.setRun('gotoThen');
		return;
	}

	var res = creep.upgradeController(controller);
	if (res === ERR_NOT_ENOUGH_ENERGY) {
		creep.memory.range = 1;
		delete creep.memory.target;
		creep.setRun('gotoThen');
	} else if (res !== OK) {
		creep.log('error upgrading controller ' + creep.name + ':' + strerror(res));
	}
};

module.exports = {};