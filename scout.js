/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Scout');
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

Spawn.prototype.makeScout = function (init) {
	//init = init || {};
	var mem = {};
	mem.run = 'startScout';
	mem.genesis = 'makeScout';
	mem.room = init.room;

	var body = [MOVE]; // bare minimum creep body definition
	var extras = [MOVE];
	var bonus = [];
	var extraBonus = [];

	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.startScout = function () {
	var creep = this;
	var mem = creep.memory;
	
	creep.setGoing(new RoomPosition(25, 25, mem.room), 'runScout', 20);
};

Creep.prototype.runScout = function () {
	this.basicCreepRespawn(this.memory);
	if (this.room.name !== this.memory.room) {
		this.setGoing(new RoomPosition(25, 25, this.memory.room), 'runScout', 20);
	}
	
};

module.exports = {};