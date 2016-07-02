/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('melee');
 * mod.thing == 'a thing'; // true
 */

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

module.exports = {};