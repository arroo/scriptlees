/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('miner');
 * mod.thing == 'a thing'; // true
 */

require('CreepFactory');
var utils = require('utils');

var WALKING = 0;
var MINING = 1;
var DROPPING = 2;

Spawn.prototype.makeMiner = function (init) {
	init = init || {};
	var mem = {};
	mem.flag = init.flag;
	mem.run = 'gotoThen';
	mem.state = MINING;
	mem.genesis = 'makeMiner';
	
	
	var destinationInfo = {
		'range': 0,
		'then': 'runMiner'
	};
	//console.log('flag name: ' + init.flag)
	//console.log(JSON.stringify(Game.flags[init.flag]))
	var flag = Game.flags[init.flag];
	console.log('makeMiner:finding location of flag:' + init.flag);
	var spots = this.room.openSpotsNear(flag);//flag.room.memory.sourceFlags[init.flag].adjacent;
	
	var adjacent = spots.reduce(function (pos, spot) {
		if (pos) {
			return pos;
		}
		
		var isContainer = function (obj) {
			return obj.structureType && obj.structureType === STRUCTURE_CONTAINER;
		};
		
		if (spot.lookFor(LOOK_STRUCTURES).filter(isContainer)) {
			return spot;
		}
		
		if (spot.lookFor(LOOK_CONSTRUCTION_SITES).filter(isContainer)) {
			return spot;
		}
		
	}) || this.pos.findClosestByRange(spots);
	
	// hack because it's not working for some reason
	if (init.flag === 'Flag2') {
		adjacent = this.room.getPositionAt(17,40);
	}
	
	console.log('makeMiner: found closest spot to flag:', JSON.stringify(adjacent));
	destinationInfo.target = adjacent;
	mem.destination = destinationInfo;
	

	var body = [MOVE, WORK, CARRY]; // bare minimum creep body definition
	var extras = [WORK, WORK, WORK, WORK];
	var bonus = [MOVE, MOVE, MOVE, MOVE];
	var extraBonus = [];
	
	return this.CreepFactory(body, mem, extras, bonus, extraBonus);
};

Creep.prototype.runMiner = function() {
	var creep = this;
	var res;
	// Walk to predefined energy source
	var flag = Game.flags[creep.memory.flag];
	var source = Game.getObjectById(flag.room.memory.sourceFlags[flag.name].source);
	
	flag.room.memory.sourceFlags[flag.name].miner = creep.id;
//    var adjacent = flag.room.memory.sourceFlags[flag.name].adjacent;
//    adjacent = new RoomPosition(adjacent.x, adjacent.y, flag.room.name);
//    if (creep.memory.state === WALKING) {
//        if (creep.pos.isEqualTo(adjacent)) {
//            creep.memory.state = MINING;
//
//        } else {
//            creep.moveTo(adjacent, {'reusePath':0});
//            return;
//        }
//    }
	
	// put down a construction site if needed
	if (!creep.pos.lookFor(LOOK_STRUCTURES).filter(function (structure) {return structure.structureType===STRUCTURE_CONTAINER}).length) {
		creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
	}
	// mine energy
	if (_.sum(creep.carry) < creep.carryCapacity && creep.memory.state === MINING) {
		res = creep.harvest(source);
		if (res !== OK) {
			console.log('miner ' + creep.name + ' unable to mine:' + utils.strerror(res));
		}
		creep.drop(RESOURCE_ENERGY);
		return;
	}
	creep.memory.state = DROPPING;
	// build construction site if on it
	var containerSite = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).filter(function (structure) {return structure.structureType===STRUCTURE_CONTAINER});
	if (containerSite.length) {
		creep.build(containerSite[0]);
		
	} else {
		// drop energy into container
		creep.drop(RESOURCE_ENERGY);
	}
	
	if (_.sum(creep.carry) <= 0) {
		creep.memory.state = MINING;
	}
};

module.exports = {};