require('CreepFactory');
var PriorityQueue = require('pqueue');
var utils = require('utils');
var strerror = utils.strerror;
var flags = require('flags');
var cat = utils.cat;

var CLAIMING = 0;
var RESERVING = 1;
var ATTACKING = 2;


Spawn.prototype.makeClaimer = function (init) {
	init = init || {};
	var mem = {};

	mem.room = init.room;

	mem.task = init.task;

	mem.run = 'startClaimer';
	mem.genesis = 'makeClaimer';


	var body = [MOVE, CLAIM]; // bare minimum creep body definition
	var extras = [CLAIM];
	var bonus = [MOVE, MOVE, CLAIM, CLAIM, CLAIM, MOVE, MOVE];
	var extraBonus = [TOUGH];

	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.startClaimer = function () {
	var creep = this;

	var target = new RoomPosition(25, 25, creep.memory.room);

	var thenFunction = 'suicide';
	switch (creep.memory.task) {
		case ATTACKING:
			thenFunction = 'attackClaimer';
			break;
		case CLAIMING:
			thenFunction = 'claimClaimer';
			break;
		case RESERVING:
			thenFunction = 'reserveClaimer';
			break;
		default:
			thenFunction = 'suicide';
			break;
	}

	if (target) {
		creep.memory.target = target;
		creep.setGoing(target, thenFunction, 1, 'movingTargetClaimer');
	} else {
		creep.log('cannot get a position in target room ' + creep.memory.room);
	}
};

var makeInit = function (creep) {
	var init = {};
	init.room = creep.memory.room;
	init.task = creep.memory.task;
	return init;
};

Creep.prototype.movingTargetClaimer = function () {
	var creep = this;
	
	this.basicCreepRespawn(makeInit(creep));
	var mem = creep.memory;

	var target = {};
	target.pos = new RoomPosition(mem.target.x, mem.target.y, mem.target.roomName);
	if (creep.room.name === mem.room) {
		// switch to walking to controller
		target = creep.room.controller;
	}

	if (!target) {
		throw mem.genesis + ' ' + creep.name + ' sent to room with no controller:' + mem.room;
	}

	return target.pos;
};

Creep.prototype.attackClaimer = function () {
	var creep = this;

	this.basicCreepRespawn(makeInit(creep));
	
	creep.log('build claim attack')
};

Creep.prototype.reserveClaimer = function () {
	var creep = this;
	this.basicCreepRespawn(makeInit(creep));

	var reservation = creep.reserveController(creep.room.controller);
	
	if (reservation !== OK) {
		creep.log('unable to reserve controller in ' + creep.room.name + ':' + strerror(reservation));
	}
};

Creep.prototype.claimClaimer = function () {
	var creep = this;
	creep.log('build claim claim');
	this.basicCreepRespawn(makeInit(creep));
};

module.exports = {};