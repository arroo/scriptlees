
var needsRepair = function (thing) {
	if (thing.hits && thing.hitsMax) {
		return thing.hits < thing.hitsMax;
	}

	
};

var howDamaged = function (thing) {
	return thing.hits / thing.hitsMax;
};

var howDead = function (thing) {
	return thing.hits;
};

StructureTower.prototype.doAction = function (action, target) {
	if (target) {
		this[action](target);
		return true;
	}
	return false;
};

StructureTower.prototype.doAttacks = function () {
	return this.doAction('attack', this.room.find(FIND_HOSTILE_CREEPS).sort(howDead)[0]) ||
		this.doAction('attack', this.room.find(FIND_HOSTILE_STRUCTURES).sort(howDead)[0]);
};

StructureTower.prototype.doRepairs = function () {
	return this.doAction('repair', this.room.find(FIND_MY_STRUCTURES, {filter: needsRepair}).sort(howDamaged).reverse()[0]) ||
		this.doAction('repair', this.room.find(FIND_STRUCTURES, {filter: needsRepair}).sort(howDamaged).reverse()[0]);
};

StructureTower.prototype.doHeals = function () {
	return this.doAction('heal', this.pos.findClosestByRange(FIND_MY_CREEPS, {filter: needsRepair}));
};

StructureTower.prototype.doTriage = function () {
	return this.doAction('heal', this.room.warZone.pos.find(FIND_MY_CREEPS, {filter: needsRepair}).sort(howDamaged).reverse()[0]);
};

StructureTower.prototype.run = function () {

	try {
		(this.room.memory.warZone && (this.doAttacks() || this.doTriage())) || this.doRepairs() || this.doHeals();

	} catch (error) {
		console.log('tower ' + this.id + ' run error:', error);
	}

	return;
	if (this.room.memory.warZone) {
		console.log('room ' + this.room.name + ' is at war!');
		this.doAttacks() || this.doTriage();

	} else {
		this.doRepairs() || this.doHeals();
	}
};

module.exports = {};