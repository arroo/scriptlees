
var needsRepair = function (thing) {
	if (thing.hits && thing.hitsMax) {
		return thing.hits < thing.hitsMax;
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

StructureTower.prototype.doAttacks = function () {

	var target = _.min(this.room.find(FIND_HOSTILE_CREEPS), howDead);
	if (target === Infinity) {
		target = undefined;
	}

	if (!target) {
		target = _.min(this.room.find(FIND_HOSTILE_STRUCTURES), howDead);
	}
	if (target === Infinity) {
		target = undefined;
	}

	return this.doAction('attack', target);
};

StructureTower.prototype.doRepairs = function () {
	var target = _.min(this.room.find(FIND_MY_STRUCTURES, {filter: needsRepair}), howDamaged);
	if (target === Infinity) {
		target = undefined;
	}

	if (!target) {
		target = _.min(this.room.find(FIND_STRUCTURES, {filter: needsRepair}), howDamaged);
	}
	if (target === Infinity) {
		target = undefined;
	}

	return this.doAction('repair', target);
};

StructureTower.prototype.doHeals = function () {
	return this.doAction('heal', this.pos.findClosestByRange(FIND_MY_CREEPS, {filter: needsRepair}));
};

StructureTower.prototype.doTriage = function () {
	var target = _.min(this.room.warZone.pos.find(FIND_MY_CREEPS, {filter: needsRepair}), howDamaged);
	if (target === Infinity) {
		target = undefined;
	}
	return this.doAction('heal', target);
};

StructureTower.prototype.run = function () {

	try {
		if (this.energy >= TOWER_ENERGY_COST) {
			(this.room.memory.warZone && (this.doAttacks() || this.doTriage())) || this.doRepairs() || this.doHeals();
		}

	} catch (error) {
		console.log('tower ' + this.id + ' run error:', error);
	}

	
};

module.exports = {};