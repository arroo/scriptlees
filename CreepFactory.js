/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('CreepFactory');
 * mod.thing == 'a thing'; // true
 */

var roomEnergyCreepMax = 0.5;

Spawn.prototype.CreepFactory = function (body, mem, extras, bonus, extraBonus) {

	var energyCapacityAvailable = this.room.energyCapacityAvailable;

	var minParts = body.length;
	extras = extras || [];
	bonus = bonus || [];
	extraBonus = extraBonus || [];
	var hasExtras = false;
	var bodyCost = function (body) {
		return body.reduce(function (total, part) {return total + BODYPART_COST[part]}, 0);
	};

	// add as many parts as room will allow
	while (extras.length && bodyCost(body) < energyCapacityAvailable && body.length < MAX_CREEP_SIZE && bodyCost(body) < energyCapacityAvailable * roomEnergyCreepMax) {
		body.push(extras.shift());
	}

	// add as many parts as current energy stores will allow
	while (bonus.length && bodyCost(body) < this.room.energyAvailable && body.length < MAX_CREEP_SIZE && bodyCost(body) < energyCapacityAvailable * roomEnergyCreepMax) {
		hasExtras = true;
		body.push(bonus.shift());
	}

	// add bonus parts repeatedly as current energy stores will allow
	var i = 0;
	while (extraBonus.length && bodyCost(body) < this.room.energyAvailable && body.length < MAX_CREEP_SIZE && bodyCost(body) < energyCapacityAvailable * roomEnergyCreepMax) {
		body.push(extraBonus[i]);
		hasExtras = true;
		i = (i + 1) % extraBonus.length;
	}

	// make sure room can support this creep
	if (body.length > minParts && bodyCost(body) > energyCapacityAvailable || (hasExtras && bodyCost(body) > this.room.energyAvailable)) {
		body.pop();
	}

	body = body.sort(bodyPartSorter);

	return this.createCreep(body, undefined, mem);
};

var bodyPartSorter = function (a, b) {
	if (a === TOUGH) {
		return -1;
	}

	if (b === TOUGH) {
		return 1;
	}

	if (a === CARRY) {
		return -1;
	}

	if (b === CARRY) {
		return 1;
	}

	if (a === MOVE) {
		return -1;
	}

	if (b === MOVE) {
		return 1;
	}

	return 0;
};

module.exports = {};
