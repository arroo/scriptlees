/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('controllerLevelInfo');
 * mod.thing == 'a thing'; // true
 */


StructureController.prototype.getBuildings = function (level) {

	level = level || this.level;

	var buildings = {
		'infinite': {},
		'limited' : {}
	};

	if (level >= 0) {
		buildings.infinite[STRUCTURE_ROAD] = true;

		buildings.limited[STRUCTURE_CONTAINER] = 5;
	}

	if (level >= 1) {
		buildings.limited[STRUCTURE_SPAWN] = 1;
	}

	if (level >= 2) {
		buildings.infinite[STRUCTURE_WALL] = true;
		buildings.infinite[STRUCTURE_RAMPART] = true;

		buildings.limited[STRUCTURE_EXTENSION] = 5;
	}

	if (level >= 3) {
		buildings.limited[STRUCTURE_EXTENSION] = 10;
		buildings.limited[STRUCTURE_TOWER] = 1;
	}

	if (level >= 4) {
		buildings.limited[STRUCTURE_EXTENSION] = 20;
		buildings.limited[STRUCTURE_STORAGE] = 1;
	}

	if (level >= 5) {
		buildings.limited[STRUCTURE_EXTENSION] = 30;
		buildings.limited[STRUCTURE_TOWER] = 2;
		buildings.limited[STRUCTURE_LINK] = 2;
	}

	if (level >= 6) {
		buildings.limited[STRUCTURE_EXTENSION] = 40;
		buildings.limited[STRUCTURE_TOWER] = 2;
		buildings.limited[STRUCTURE_LINK] = 3;
		buildings.limited[STRUCTURE_EXTRACTOR] = 1;
		buildings.limited[STRUCTURE_TERMINAL] = 1;
		buildings.limited[STRUCTURE_LAB] = 3;
	}

	if (level >= 7) {
		buildings.limited[STRUCTURE_EXTENSION] = 50;
		buildings.limited[STRUCTURE_SPAWN] = 2;
		buildings.limited[STRUCTURE_LINK] = 4;
		buildings.limited[STRUCTURE_LAB] = 6;
	}

	if (level >= 8) {
		buildings.limited[STRUCTURE_EXTENSION] = 60;
		buildings.limited[STRUCTURE_SPAWN] = 3;
		buildings.limited[STRUCTURE_TOWER] = 6;
		buildings.limited[STRUCTURE_LINK] = 6;
		buildings.limited[STRUCTURE_LAB] = 10;
		buildings.limited[STRUCTURE_OBSERVER] = 1;
		buildings.limited[STRUCTURE_POWER_SPAWN] = 1;
	}
};


module.exports = {};