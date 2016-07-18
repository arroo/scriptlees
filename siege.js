require('CreepFactory');
var utils = require('utils');
var strerror = utils.strerror;
var flags = require('flags');
var cat = utils.cat;


Spawn.prototype.makeSiege = function (init) {
	init = init || {};
	var mem = {};

	mem.room = init.room;
	mem.run = 'startSiege';
	mem.genesis = 'makeSiege';


	var body = [MOVE, WORK, TOUGH]; // bare minimum creep body definition
	var extras = [MOVE, WORK, TOUGH];
	var bonus = [MOVE, WORK, TOUGH];
	var extraBonus = [MOVE, WORK, MOVE, TOUGH];

	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.startSiege = function () {
	var creep = this;

	var target = new RoomPosition(25, 25, creep.memory.room);

	if (target) {
		//creep.memory.target = target.id;
		creep.setGoing(target, 'fillSiege', 1, 'movingTargetSiege');
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

Creep.prototype.movingTargetSiege = function () {
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
				mem.destination.then = 'runSiege';
			} else {
				target = creep.pos.findNearestStructureTypes(STRUCTURE_CONTROLLER, true);
				mem.destination.then = 'upgraderSiege';
			}

			mem.destination.range = 3;
		} else {
			target = creep.pos.findNearestSource(mem.resource, neededResource);
			if (!target) {
				target = creep.pos.findNearestSource(mem.resource);
			}
			mem.destination.then = 'fillSiege';
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

Creep.prototype.fillSiege = function () {
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
		console.log('error filling siege ' + creep.name + ':' + strerror(res));
	}
};

Creep.prototype.upgraderSiege = function () {
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
		console.log('error siege upgrading controller ' + creep.name + ':' + strerror(res));
	}
};

Creep.prototype.runSiege = function () {
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
		console.log('siege ' + creep.name + 'cannot build site:' + site.id + ':' +strerror(res));
	}

};

module.exports = {};