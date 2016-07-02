
var needsRepair = function (thing) {
	if (thing.hits && thing.hitsMax) {
		return thing.hits < thing.hitsMax;
	}

	
};

var howDamaged = function (a, b) {
	return (b.hits / b.hitsMax) - (a.hits / a.hitsMax);
};

var howDead = function (a, b) {
	return a.hits - b.hits;
};

StructureTower.prototype.doAction = function (action, target, amount) {
	if (target) {
		this[action](target, amount);
		return true;
	}
	return false;
};

var notNearMeNeedsEnergy = function (creep) {
	switch (creep.memory.genesis) {
		case 'makeBuilder':
		case 'makeRepairer':
			break;
		default:
			return false;
	}
	if (creep.pos.isNearTo(this)) {
		return false;
	}
	return creep.carry[RESOURCE_ENERGY] < creep.carryCapacity;
};

var howEmpty = function (a, b) {
	return (b.carry[RESOURCE_ENERGY] / b.carryCapacity) - (a.carry[RESOURCE_ENERGY] / a.carryCapacity);
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

StructureTower.prototype.doXfers = function () {
	return this.doAction('transferEnergy', this.room.find(FIND_MY_CREEPS, {filter: notNearMeNeedsEnergy.bind(this)}).sort(howEmpty).reverse()[0]);
};

StructureTower.prototype.run = function () {

	try {
		(this.room.memory.warZone && (this.doAttacks() || this.doTriage())) || this.doRepairs() || this.doHeals() || this.doXfers();

	} catch (error) {
		console.log('tower ' + this.id + ' run error:', error);
	}

	
};

module.exports = {};