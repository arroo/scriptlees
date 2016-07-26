
var BATTLE_RESERVE_PERCENT = 0.75;
var MAX_SIEGE_HP = Math.min(CREEP_LIFE_TIME * DISMANTLE_POWER * (MAX_CREEP_SIZE / 2) * 5, WALL_HITS_MAX);


var needsRepair = function (thing) {
	if (thing.hits && thing.hitsMax) {
		return thing.hits < thing.hitsMax && thing.hits < MAX_SIEGE_HP;
	}
};

var howDamaged = function (a) {
	return a.hits / a.hitsMax;
};

var howDead = function (a) {
	return a.hits;
};

StructureTower.prototype.doAction = function (action, target, amount) {
	if (target) {
		this[action](target, amount);
		return true;
	}
	return false;
};

StructureTower.prototype.doAttacksAndTriage = function () {

	var targetHostile = _.min(this.room.find(FIND_HOSTILE_CREEPS), howDead);
	var targetFriendly = _.min(this.room.find(FIND_MY_CREEPS, {filter: needsRepair}), howDamaged);

	if (targetHostile === Infinity && targetFriendly === Infinity) {
		
	} else if (targetHostile === Infinity) {
		return this.doAction('heal', targetFriendly);
	} else if (targetFriendly === Infinity) {
		return this.doAction('attack', targetHostile);
	} else if (targetFriendly.hits < targetHostile.hits) {
		return this.doAction('heal', targetFriendly);
	} else {
		return this.doAction('attack', targetHostile);
	}
};

StructureTower.prototype.doRepairs = function () {
	var target = _.min(this.room.find(FIND_STRUCTURES, {filter: needsRepair}), howDead); // try doing raw hitpoint count
	if (target === Infinity) {
		target = undefined;
	}

	return this.doAction('repair', target);
};

StructureTower.prototype.doHeals = function () {
	return this.doAction('heal', this.pos.findClosestByRange(FIND_MY_CREEPS, {filter: needsRepair}));
};

StructureTower.prototype.run = function () {

	try {
		if (this.room.memory.warZone || this.energy / this.energyCapacity >= BATTLE_RESERVE_PERCENT) {
			(this.room.memory.warZone && (this.doAttacksAndTriage())) || this.doRepairs() || this.doHeals();
		}

	} catch (error) {
		console.log('tower ' + this.id + ' run error:', error);
	}

	
};

module.exports = {};