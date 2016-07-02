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
	
	sources = room.find(FIND_DROPPED_RESOURCES, {filter: {resourceType:RESOURCE_ENERGY}}).reduce(cat, sources);
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
		if (obj) {
			return obj;
		}
		
		if (pos.findPath(source)) {
			return source;
		}
	});
	
	
	if (target) {
		return target;
	}
	
	if (!target) {
		sources = room.find(FIND_SOURCES).reduce(cat, sources);
		sources = room.find(FIND_DROPPED_RESOURCES, {filter: {resourceType:RESOURCE_ENERGY}}).reduce(cat, sources);
		target = pos.findClosestByPath(sources);
	}
	
	return target;
};

Spawn.prototype.makeBuilder = function (init) {
	init = init || {};
	var mem = init.mem || {};
	mem.pq = init.pq;
	mem.run = 'gotoThen';
	mem.state = FILLING;
	mem.genesis = 'makeBuilder';

	var destinationInfo = {
		'range': 1,
		'then': 'fillBuilder'
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

Creep.prototype.movingTargetBuilder = function () {
	var creep = this;
	var target;
	if (Game.constructionSites[creep.memory.site]) {
		target = Game.getObjectById(creep.memory.site);
	}
	if (!target && Object.keys(Game.constructionSites).length) {

		var pq = new PriorityQueue(creep.memory.pq);
		while (!target) {
			var prioritySite = pq.dequeue();
			
			if (!prioritySite) {
				break;
			}
			target = Game.getObjectById(prioritySite);
		}
		
		if (!target) {
			target = creep.pos.findClosestByRange(Object.keys(Game.constructionSites).map(function (id) {return Game.constructionSites[id]}));
		}
	} 
	if (!target) {
		//console.log('builder found moving target: controller')
		creep.memory.destination.then = 'upgraderBuilder';
		creep.memory.destination.range = 3;
		target = creep.room.controller;
	} else {
		creep.memory.site = target.id;
		creep.memory.destination.then = 'runBuilder';
		creep.memory.destination.range = 3;
	}
	
	return target.pos;
};

Creep.prototype.fillBuilder = function () {
	var creep = this;
	var source = Game.getObjectById(creep.memory.destination.source);
	if (_.sum(creep.carry) >= creep.carryCapacity || !source) {
		creep.say('full');
		creep.memory.destination.movingTarget = 'movingTargetBuilder';
		creep.memory.destination.range = 3;
		creep.memory.destination.then = 'runBuilder';
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
		creep.memory.destination.then ='fillBuilder';
		creep.memory.destination.range = 1;
		creep.setAndRun('gotoThen');
	} else if (res !== OK) {
		console.log('error filling builder ' + creep.name + ':' + strerror(res));
	}
};

Creep.prototype.upgraderBuilder = function () {
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
		creep.memory.destination.then ='fillBuilder';
		creep.memory.destination.range = 1;
		creep.setAndRun('gotoThen');
		return;
	}
	
	var controller = creep.room.controller;
	
	var res = creep.upgradeController(controller);
	if (res !== OK) {
		console.log('builder ' + creep.name + ' unable to upgrade room ' + creep.room.name + ':' + strerror(res));
		delete creep.memory.destination.movingTarget;
		creep.memory.destination.then = 'fillBuilder';
		creep.setAndRun('gotoThen');
	}
};

Creep.prototype.runBuilder = function () {
	var creep = this;
	var res;
	var site = Game.getObjectById(creep.memory.site);

	if (_.sum(creep.carry) <= 0 || !site) {
		delete creep.memory.destination.movingTarget;
		var source = findNearestSource(creep.pos);
		creep.memory.destination.target = source.pos;
		creep.memory.destination.source = source.id;
		creep.memory.destination.then = 'fillBuilder';
		creep.memory.destination.range = 1;
		creep.setAndRun('gotoThen');
		return;
	}

	res = creep.build(site);
	if (res !== OK) {
		console.log('builder ' + creep.name + 'cannot build site:' + site.id + ':' +strerror(res));
	} else {
		creep.memory.pq = new PriorityQueue(creep.memory.pq).queue(0, site.id);
	}
	
	
};

module.exports = {};