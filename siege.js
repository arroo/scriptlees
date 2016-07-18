require('CreepFactory');
var PriorityQueue = require('pqueue');
var utils = require('utils');
var strerror = utils.strerror;
var flags = require('flags');
var cat = utils.cat;

var CLAIMING = 0;
var RESERVING = 1;
var ATTACKING = 2;


Spawn.prototype.makeSiege = function (init) {
	init = init || {};
	var mem = {};

	mem.room = init.room;

	mem.run = 'startSiege';
	mem.genesis = 'makeSiege';
	var mine = false;
	try {
		mine = Game.rooms[mem.room].controller.my;
	} catch (err) {}

	if (mine) {
		return this.makeUpgrader(init);
	}

	var body = [MOVE, WORK, ATTACK]; // bare minimum creep body definition
	var extras = [MOVE, WORK, TOUGH];
	var bonus = [MOVE, WORK, TOUGH, MOVE, WORK, TOUGH];
	var extraBonus = [TOUGH];

	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.startSiege = function () {
	var creep = this;

	var target = new RoomPosition(25, 25, creep.memory.room);

	if (target) {
		creep.memory.target = target;
		creep.setGoing(target, 'attackSiege', 0, 'movingTargetSiege');
	} else {
		creep.log('cannot get a position in target room ' + creep.memory.room);
	}
};

var makeInit = function (creep) {
	var init = {};
	init.room = creep.memory.room;
	init.task = 0;
	return init;
};

Creep.prototype.movingTargetSiege = function () {
	var creep = this;

	this.basicCreepRespawn(makeInit(creep));
	var mem = creep.memory;

	var target = {};
	target.pos = new RoomPosition(mem.target.x, mem.target.y, mem.target.roomName);
	if (creep.room.name === mem.room) {
		// switch to walking to controller
		target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
	}

	if (!target) {

		creep.memory.task = 0;
		creep.memory.genesis = 'makeClaimer';
		creep.suicide();
		throw mem.genesis + ' ' + creep.name + ' sent to room with no enemy structures:' + mem.room;
	}

	return target.pos;
};

Creep.prototype.attackSiege = function () {
	var creep = this;


	this.basicCreepRespawn(makeInit(creep));


};

module.exports = {};