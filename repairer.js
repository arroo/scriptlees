/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('repairer');
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
	sources = room.find(FIND_SOURCES).reduce(cat, sources);
	sources = room.find(FIND_DROPPED_RESOURCES).reduce(cat, sources);
	sources = room.find(FIND_STRUCTURES, {filter:function(structure){return structure.structureType===STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY]}}).reduce(cat, sources);
	
	return pos.findClosestByPath(sources);
};

Spawn.prototype.makeRepairer = function (init) {
	init = init || {};
	var mem = init.mem || {};
	mem.pq = init.pq;
	mem.run = 'gotoThen';
	mem.state = FILLING;
	mem.genesis = 'makeRepairer';

	var destinationInfo = {
		'range': 1,
		'then': 'fillRepairer'
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
};

Creep.prototype.movingTargetRepairer2 = function () {
	
};

Creep.prototype.movingTargetRepairer = function () {
	var creep = this;
	var target = _.sortBy(creep.room.find(FIND_MY_STRUCTURES, {filter:function (structure) {
		return structure.hits < structure.hitsMax;
	}}).reduce(cat, []), function (structure) {return structure.hitsMax / structure.hits})[0];

	if (!target) {
		target = _.sortBy(creep.room.find(FIND_STRUCTURES, {filter:function (structure) {
			return structure.hits < structure.hitsMax && structure.structureType !== STRUCTURE_WALL;
		}}).reduce(cat, []), [function (structure) {
			switch (structure.structureType) {
				case STRUCTURE_ROAD:
				case STRUCTURE_CONTAINER:
					return 0;
				case STRUCTURE_WALL:
					return 2;
				default:
					return 1;
			}
		},function (structure) {return structure.hitsMax / structure.hits}])[0];
	}

	if (!target) {
		//console.log('builder found moving target: controller')
		creep.memory.destination.then = 'waitRepairer';
		creep.memory.destination.range = 1;
		target = creep.room.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_SPAWN}})[0];
	} else {
		creep.memory.site = target.id;
		creep.memory.destination.then = 'runRepairer';
		creep.memory.destination.range = 3;
	}
	
	return target.pos;
};

Creep.prototype.waitRepairer = function () {
	var creep = this;
	
	var target = _.sortBy(creep.room.find(FIND_MY_STRUCTURES, {filter:function (structure) {
		return structure.hits < structure.hitsMax;
	}}).reduce(cat, []), function (structure) {return structure.hitsMax / structure.hits})[0];
	if (!target) {
		target = _.sortBy(creep.room.find(FIND_STRUCTURES, {filter:function (structure) {
			return structure.hits < structure.hitsMax;
		}}).reduce(cat, []), function (structure) {return structure.hitsMax / structure.hits})[0];
	}
	if (target) {
		creep.memory.site = target.id;
		creep.memory.destination.then = 'runRepairer';
		creep.memory.destination.range = 3;
		creep.setRun('gotoThen');
		
	} else {
		creep.say('all fixed');
	}
};

Creep.prototype.fillRepairer = function () {
	var creep = this;
	var source = Game.getObjectById(creep.memory.destination.source);
	if (_.sum(creep.carry) >= creep.carryCapacity || !source) {
		creep.say('full');
		creep.memory.destination.movingTarget = 'movingTargetRepairer';
		creep.memory.destination.then = 'runRepairer';
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
		console.log('error filling repairer ' + creep.name + ':' + strerror(res));
	}
};

Creep.prototype.upgraderRepairer = function () {
	var creep = this;
	if (_.sum(creep.carry) <= 0) {
		creep.say('empty');
		delete creep.memory.destination.movingTarget;
		var source = findNearestSource(creep.pos);
		creep.memory.destination.target = source.pos;
		creep.memory.destination.source = source.id;
		creep.memory.destination.then ='fillRepairer';
		creep.memory.destination.range = 1;
		creep.setAndRun('gotoThen');
		return;
	}
	
	var controller = creep.room.controller;
	
	var res = creep.upgradeController(controller);
	if (res !== OK) {
		console.log('harvester ' + creep.name + ' unable to upgrade room ' + creep.room.name + ':' + strerror(res));
		delete creep.memory.destination.movingTarget;
		creep.memory.destination.then = 'fillRepairer';
		creep.setAndRun('gotoThen');
	}
};

Creep.prototype.runRepairer = function () {
	var creep = this;
	var res;
	var site = Game.getObjectById(creep.memory.site);

	if (_.sum(creep.carry) <= 0) {
		delete creep.memory.destination.movingTarget;
		var source = findNearestSource(creep.pos);
		if (!source) {
			return;
		}
		creep.memory.destination.target = source.pos;
		creep.memory.destination.source = source.id;
		creep.memory.destination.then = 'fillRepairer';
		creep.memory.destination.range = 1;
		creep.setAndRun('gotoThen');
		return;
	}



	if (!site || site.hits >= site.hitsMax) {
		creep.memory.destination.movingTarget = 'movingTargetRepairer';
		creep.memory.destination.then = 'runRepairer';
		creep.setAndRun('gotoThen');
		return;
	}

	res = creep.repair(site);
	if (res !== OK) {
		console.log('repairer ' + creep.name + 'cannot transfer to site:' + site.id + ':' +strerror(res));
	} else {
		creep.memory.pq = new PriorityQueue(creep.memory.pq).queue(0, site.id);
	}
	
	
};

module.exports = {};