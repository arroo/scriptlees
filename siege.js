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
	mem.clipping = true;
	mem.run = 'startSiege';
	mem.genesis = 'makeSiege';
	var mine = false;
	try {
		mine = Game.rooms[mem.room].controller.my;
	} catch (err) {}

	if (mine) {
		return this.makeUpgrader(init);
	}

	mem.signalledDemise = true;
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
		creep.setGoing(target, 'startSiege', 0, 'movingTargetSiege');
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
	var nearTarget = false;
	if (creep.room.name === mem.room) {
		// switch to walking to controller
		var structs = creep.room.find(FIND_HOSTILE_STRUCTURES).filter(s => s.structureType !== STRUCTURE_CONTROLLER && s.structureType !== STRUCTURE_STORAGE);
		target = creep.pos.findClosestByRange(structs);
//		creep.log('looking for hostile structures...:' + JSON.stringify(target))
		if (target && creep.pos.isNearTo(target)) {
			creep.dismantle(target);
			nearTarget = true;
		}
	}

	var myRoom = false;
	if (creep.room.controller && creep.room.controller.my) {
		myRoom = true;
	}

	if (!nearTarget && !myRoom) {
		let x = creep.pos.x;
		let y = creep.pos.y;
		try {
			let sieging = creep.room.lookForAtArea(LOOK_STRUCTURES, y - 1, x - 1, y + 1, x + 1, true).map(s => s.structure).filter(s => s.structureType !== STRUCTURE_ROAD).map(s => creep.dismantle(s));
			creep.log('sieging: ' + JSON.stringify(sieging))
		} catch (e) {}
	}

	creep.memory.clipping = !myRoom;

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