/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('roomPlanner');
 * mod.thing == 'a thing'; // true
 */
require('controllerLevelInfo');
Room.prototype['plan' + STRUCTURE_CONTAINER] = function (max) {
};

Room.prototype['plan' + STRUCTURE_CONTROLLER] = function (max) {};

Room.prototype['plan' + STRUCTURE_EXTENSION] = function (max) {};

Room.prototype['plan' + STRUCTURE_EXTRACTOR] = function (max) {};

Room.prototype['plan' + STRUCTURE_KEEPER_LAIR] = function (max) {};

Room.prototype['plan' + STRUCTURE_LAB] = function (max) {};

Room.prototype['plan' + STRUCTURE_LINK] = function (max) {};

Room.prototype['plan' + STRUCTURE_NUKER] = function (max) {};

Room.prototype['plan' + STRUCTURE_OBSERVER] = function (max) {};

Room.prototype['plan' + STRUCTURE_POWER_BANK] = function (max) {};

Room.prototype['plan' + STRUCTURE_POWER_SPAWN] = function (max) {};

Room.prototype['plan' + STRUCTURE_PORTAL] = function (max) {};

Room.prototype['plan' + STRUCTURE_RAMPART] = function (max) {};

Room.prototype['plan' + STRUCTURE_ROAD] = function (max) {};

Room.prototype['plan' + STRUCTURE_SPAWN] = function (max) {};

Room.prototype['plan' + STRUCTURE_STORAGE] = function (max) {};

Room.prototype['plan' + STRUCTURE_TERMINAL] = function (max) {};

Room.prototype['plan' + STRUCTURE_TOWER] = function (max) {};

Room.prototype['plan' + STRUCTURE_WALL] = function (max) {};



Room.prototype.plan = function (max) {
//    console.log('room ' + this.name + ' time to plan...');
	return;

	var maxLevelPlan = this.memory.maxLevelPlan || 4; // start with something to plan

//    var existingStructures = this.find(FIND_STRUCTURES, {filter: {s => struct.my || ty}})
	
	var possibleStructures = this.controller.getBuildings(maxLevelPlan);
	
};

module.exports = {};