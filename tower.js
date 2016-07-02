
StructureTower.prototype.doAction = function (action, target) {
	if (target) {
		this[action](target);
		return true;
	}
	return false;
};

StructureTower.prototype.doAttacks = function () {
	return this.doAction('attack', this.room.find(FIND_HOSTILE_CREEPS).sort(c => c.hits)[0]);
};

StructureTower.prototype.doRepairs = function () {
	return this.doAction('repair', this.room.find(FIND_MY_STRUCTURES, {filter: c => c.hits < c.hitsMax}).sort(s => s.hitsMax / s.hits)[0]) ||
		this.doAction('repair', this.room.find(FIND_STRUCTURES, {filter: c => c.hits < c.hitsMax}).sort(s => s.hitsMax / s.hits)[0]);
};

StructureTower.prototype.doHeals = function () {
	return this.doAction('heal', this.pos.findClosestByRange(FIND_MY_CREEPS, {filter: c => c.hits < c.hitsMax}));
};

StructureTower.prototype.doTriage = function () {
	return this.doAction('heal', this.room.warZone.pos.find(FIND_MY_CREEPS, {filter: c => c.hits < c.hitsMax}).sort(c => c.hits)[0]);
};

StructureTower.prototype.run = function () {

	try {
		(this.room.warZone && (this.doAttacks() || this.doTriage())) || this.doRepairs() || this.doHeals();

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