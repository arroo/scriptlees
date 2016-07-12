/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('flags');
 * mod.thing == 'a thing'; // true
 */

var delimiter = '_';

var utils = require('utils');
var allPairs = utils.allPairs;
//var utils = require('utils');
var combos = {};
combos[RESOURCE_ENERGY] = [COLOR_GREEN, COLOR_YELLOW];
combos[RESOURCE_POWER] = [COLOR_GREEN, COLOR_RED];
combos[RESOURCE_HYDROGEN] = [COLOR_GREEN, COLOR_CYAN];
combos[RESOURCE_OXYGEN] = [COLOR_GREEN, COLOR_BLUE];
combos[RESOURCE_UTRIUM] = [COLOR_GREEN, COLOR_WHITE];
combos[RESOURCE_LEMERGIUM] = [COLOR_GREEN, COLOR_GREY];
combos[RESOURCE_KEANIUM] = [COLOR_GREEN, COLOR_PURPLE];
combos[RESOURCE_ZYNTHIUM] = [COLOR_GREEN, COLOR_BROWN];
combos[RESOURCE_GHODIUM] = [COLOR_GREEN, COLOR_ORANGE];
combos[RESOURCE_CATALYST] = [COLOR_GREEN, COLOR_GREEN];

combos[STRUCTURE_CONTAINER] = [COLOR_BROWN, COLOR_RED];
combos[STRUCTURE_CONTROLLER] = [COLOR_BROWN, COLOR_WHITE];
combos[STRUCTURE_EXTENSION] = [COLOR_BROWN, COLOR_CYAN];
combos[STRUCTURE_EXTRACTOR] = [COLOR_BROWN, COLOR_PURPLE];
combos[STRUCTURE_KEEPER_LAIR] = [COLOR_BROWN, COLOR_BLUE];
combos[STRUCTURE_LAB] = [COLOR_BROWN, COLOR_GREEN];
combos[STRUCTURE_LINK] = [COLOR_BROWN, COLOR_YELLOW];
combos[STRUCTURE_NUKER] = [COLOR_BROWN, COLOR_ORANGE];
combos[STRUCTURE_OBSERVER] = [COLOR_BROWN, COLOR_BROWN];
combos[STRUCTURE_POWER_BANK] = [COLOR_BROWN, COLOR_GREY];

combos[STRUCTURE_POWER_SPAWN] = [COLOR_ORANGE, COLOR_WHITE];
combos[STRUCTURE_PORTAL] = [COLOR_ORANGE, COLOR_BLUE];
combos[STRUCTURE_RAMPART] = [COLOR_ORANGE, COLOR_CYAN];
combos[STRUCTURE_ROAD] = [COLOR_ORANGE, COLOR_RED];
combos[STRUCTURE_SPAWN] = [COLOR_ORANGE, COLOR_GREEN];
combos[STRUCTURE_STORAGE] = [COLOR_ORANGE, COLOR_BROWN];
combos[STRUCTURE_TERMINAL] = [COLOR_ORANGE, COLOR_GREY];
combos[STRUCTURE_TOWER] = [COLOR_ORANGE, COLOR_YELLOW];
combos[STRUCTURE_WALL] = [COLOR_ORANGE, COLOR_ORANGE];


// role flags
combos['makeMelee'] = [COLOR_GREY, COLOR_RED];
combos['makeRanged'] = [COLOR_GREY, COLOR_BLUE];
combos['makeHealer'] = [COLOR_GREY, COLOR_GREEN];
combos['makeBuilder'] = [COLOR_GREY, COLOR_BROWN];
combos['makeRepairer'] = [COLOR_GREY, COLOR_CYAN];
combos['makeMiner'] = [COLOR_GREY, COLOR_YELLOW];
combos['makeCourier'] = [COLOR_GREY, COLOR_WHITE];
combos['makeUpgrader'] = [COLOR_GREY, COLOR_PURPLE];
combos['makeClaimer'] = [COLOR_GREY, COLOR_ORANGE];
combos['makeUnknown'] = [COLOR_GREY, COLOR_GREY];



combos['warZone'] = [COLOR_RED, COLOR_YELLOW];

//set up backwards lookup
var backwards = Object.keys(combos).reduce((o, n) => {o[combos[n].join(delimiter)] = n; return o}, {});

var isSourceClosure = function (type) {
	var closure = function (flag) {
		return isSource(flag, type);
	};
	return closure;
};

var isSource = function (flag, type) {
	return combos[type] && flag.color === combos[type][0] && flag.secondaryColor === combos[type][1];
};

Flag.prototype.isAnySource = function () {
	return this.color === COLOR_GREEN;
};

Flag.prototype.isAnySink = function () {
	var building = this.getBuilding();
	switch (building) {
		case STRUCTURE_EXTENSION:
		case STRUCTURE_SPAWN:
		case STRUCTURE_LAB:
		case STRUCTURE_CONTROLLER:
		case STRUCTURE_TOWER:
			return true;
		default:
			return false;
	}
};

var makeSource = function (type, room, pos) {
	if (!combos[type]) {
		console.log('failed to make flag for ' + type);
		console.log(JSON.stringify(combos));
		return ERR_INVALID_ARGS;
	}
	
	return room.createFlag(pos, undefined, combos[type][0], combos[type][1]);
};

RoomObject.prototype.makeCreepTargetFlag = function (genesis) {
	var combo = combos[genesis] || combos['makeUnknown'];
	
	return this.room.createFlag(0, 0, undefined, COLOR_CYAN, combo[1]);
	
};

Flag.prototype.getBuilding = function () {
	var structure = backwards[this.color + delimiter + this.secondaryColor];
	if (structure && CONTROLLER_STRUCTURES[structure]) {
		return structure;
	}
};

Flag.prototype.getSource = function () {
	var resource = backwards[this.color + delimiter + this.secondaryColor];
	if (resource && RESOURCES_ALL.indexOf(resource) >= 0) {
		return resource;
	}
};

Flag.prototype.isBuilding = function (structureType) {
	var combo = combos[structureType];
	if (!combo) {
		return false;
	}

	return this.color === combo[0] && this.secondaryColor === combo[1];
};

Flag.prototype.isAnyBuilding = function () {

	return (this.color === COLOR_BROWN || this.color === COLOR_ORANGE && this.secondaryColor !== COLOR_PURPLE);

};

RoomPosition.prototype.createComboFlag = function (name, combo) {
	return this.createFlag(name, combo[0], combo[1]);
};

Room.prototype.moveWarFlag = function () {
	var room = this;
	var flag;
	if (!room.memory.warZone) {
		if (room.memory.warFlag) {
			flag = Game.flags[room.memory.warFlag];
			if (flag) {
				flag.remove();
			}
		}
		return;
	}

	flag = Game.flags[room.memory.warFlag];
	var warZone = room.getPositionAt(room.memory.warZone.x, room.memory.warZone.y);

	if (!flag) {
		room.memory.warFlag = warZone.createComboFlag(room.name +'_INTRUDERS', combos['warZone']);
		return;
	}

	flag.setPosition(warZone);
	
};

Creep.prototype.moveRoleFlag = function () {
	this.memory.flags = this.memory.flags || {};
	this.memory.flags.role = this.memory.flags.role || this.makeRoleFlag(this.name);
	var flag = Game.flags[this.memory.flags.role];
	
	if (_.isString(this.memory.flags.role)) {
		if (flag) {
			flag.setPosition(this.pos);
		}
	}
	
	if (this.memory.nextPos) {
		return flag.setPosition(new RoomPosition(this))
	}
};

Creep.prototype.makeRoleFlag = function (name) {
	var combo = combos[this.memory.genesis] || combos['makeUnknown'];
	
	var flag = this.pos.createFlag(name, combo[0], combo[1]);
	if (flag === ERR_NAME_EXISTS) {
		Game.flags[name].remove();
		return this.makeRoleFlag(name);
	} else if (flag !== OK) {
		return flag;
	}
	Game.flags[flag].memory.creep = this.id;
};

module.exports = {
	'makeSource': makeSource,
	'isSource': isSource,
	'isSourceClosure': isSourceClosure
};