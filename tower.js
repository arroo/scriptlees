
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
	return this.doAction('attack', _.min(this.room.find(FIND_HOSTILE_CREEPS), howDead)) ||
		this.doAction('attack', _.min(this.room.find(FIND_HOSTILE_STRUCTURES), howDead));
};

StructureTower.prototype.doRepairs = function () {
	return this.doAction('repair', _.min(this.room.find(FIND_MY_STRUCTURES, {filter: needsRepair}), howDamaged)) ||
		this.doAction('repair', _.min(this.room.find(FIND_STRUCTURES, {filter: needsRepair}), howDamaged));
};

StructureTower.prototype.doHeals = function () {
	return this.doAction('heal', this.pos.findClosestByRange(FIND_MY_CREEPS, {filter: needsRepair}));
};

StructureTower.prototype.doTriage = function () {
	return this.doAction('heal', _.min(this.room.warZone.pos.find(FIND_MY_CREEPS, {filter: needsRepair}), howDamaged));
};

StructureTower.prototype.run = function () {

	try {
		(this.room.memory.warZone && (this.doAttacks() || this.doTriage())) || this.doRepairs() || this.doHeals();

	} catch (error) {
		console.log('tower ' + this.id + ' run error:', error);
	}

	
};

module.exports = {};