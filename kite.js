/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Kite');
 * mod.thing == 'a thing'; // true
 */

require('CreepFactory');

Spawn.prototype.makeKite = function (init) {
	var mem = {};
	mem.run = 'startKite';
	mem.genesis = 'makeKite';
	mem.room = init.room;

	var body = [MOVE, MOVE, RANGED_ATTACK, HEAL]; // bare minimum creep body definition
	var extras = [MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK];
	var bonus = [MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL];
	var extraBonus = [];

	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.startKite = function () {
	var creep = this;
	var mem = creep.memory;

	creep.setGoing(new RoomPosition(25, 25, mem.room), 'runKite', 20);
};

// find closest not-source keeper minion, get within 3 spots & kablammo - then stay outside of 2 spots of it
// find closest damaged unit and try to heal it (once everything dead
Creep.prototype.runKite = function () {

	// look for non-source keeper creeps
	if (this.room.memory.warZone) {
		this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: c=>c.owner.username!=='Source Keeper'})
	}



};

module.exports = {};