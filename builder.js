require('CreepFactory');
var PriorityQueue = require('pqueue');
var utils = require('utils');
var strerror = utils.strerror;
var flags = require('flags');
var cat = utils.cat;

var BUILDING = 0;
var UPGRADING = 1;
var FILLING = 2;


Spawn.prototype.makeBuilder = function (init) {
	init = init || {};
	var mem = {};

	mem.resource = init.resource || RESOURCE_ENERGY;
	mem.run = 'startBuilder';
	mem.genesis = 'makeBuilder';


	var body = [MOVE, WORK, CARRY]; // bare minimum creep body definition
	var extras = [MOVE, WORK, CARRY];
	var bonus = [MOVE, WORK, CARRY];
	var extraBonus = [MOVE, WORK, MOVE, CARRY];
	
	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.startBuilder = function () {
	var creep = this;
	var resource = creep.memory.resource;
	
	var target = creep.pos.findNearestSource(resource, creep.carryCapacity);

	if (target) {
		creep.memory.target = target.id;
		creep.setGoing(target, 'fillBuilder', 1, 'movingTargetBuilder');
	} else {
		console.log(creep.memory.genesis + ' ' + creep.name + ' cannot find a ' + creep.memory.resource + ' source');
	}
};

RoomPosition.prototype.findNearestConstructionSite = function () {
	var pos = this;
	var nearestConstructionSite = pos.findNearestThing(function (room) {
		var sites = room.find(FIND_MY_CONSTRUCTION_SITES);

		return this.findClosestByRange(sites);
	});

	return nearestConstructionSite;
};

Creep.prototype.movingTargetBuilder = function () {
	var creep = this;
	this.basicCreepRespawn({});
	var mem = creep.memory;

	var target = Game.getObjectById(mem.target);
	var neededResource = creep.carryCapacity - _.sum(creep.carry);
	// make sure it's still a valid target
	if (target) {
		
		var predicate = s => true;
		if (target instanceof StructureController || target instanceof ConstructionSite) {
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

		if (predicate(neededResource) || target.pos.fullySurrounded()) {
			target = undefined;
		}
	}

	// target is gone/invalid, get a new one
	if (!target) {

		// check if nearest energy dump
		if (creep.carry[mem.resource]) {
			target = creep.pos.findNearestConstructionSite();
			if (target) {
				mem.destination.then = 'runBuilder';
			} else {
				target = creep.pos.findNearestStructureTypes(STRUCTURE_CONTROLLER, true);
				mem.destination.then = 'upgraderBuilder';
			}

			mem.destination.range = 3;
		} else {
			target = creep.pos.findNearestSource(mem.resource, neededResource);
			if (!target) {
				target = creep.pos.findNearestSource(mem.resource);
			}
			mem.destination.then = 'fillBuilder';
			mem.destination.range = 1;
		}
	}

	// if we still don't have a target, fuuuuck
	if (!target) {
		throw '' + mem.genesis + ' ' + creep.name + ' cannot find anywhere to go';
	}

	creep.memory.target = target.id;

	return target.pos;
};

Creep.prototype.fillBuilder = function () {
	var creep = this;
	var source = Game.getObjectById(creep.memory.target);
	this.basicCreepRespawn({});
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
		console.log('error filling builder ' + creep.name + ':' + strerror(res));
	}
};

Creep.prototype.upgraderBuilder = function () {
	var creep = this;
	var controller = Game.getObjectById(creep.memory.target);
	this.basicCreepRespawn({});
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
		console.log('error builder upgrading controller ' + creep.name + ':' + strerror(res));
	}
};

Creep.prototype.runBuilder = function () {
	var creep = this;
	var res;
	var site = Game.getObjectById(creep.memory.target);
	this.basicCreepRespawn({});
	var totalCarry = _.sum(creep.carry);
	if (totalCarry <= 0 || !site) {
		creep.memory.range = totalCarry ? 3 : 1;
		delete creep.memory.target;
		creep.setRun('gotoThen');
		return;
	}

	res = creep.build(site);
	if (res !== OK) {
		console.log('builder ' + creep.name + 'cannot build site:' + site.id + ':' +strerror(res));
	}

};

module.exports = {};