/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('prototypes');
 * mod.thing == 'a thing'; // true
 */

var flags = require('flags');
var utils = require('utils');
var cat = utils.cat;
var coerceToPositions = utils.coerceToPositions;
Source.prototype.mineralType = RESOURCE_ENERGY;

Creep.prototype.run = function () {
	try{this.moveRoleFlag();}catch(e) {
		console.log(this.memory.genesis +' ' + this.name+ ' unable to move flag:', e);
	}
	this[this.memory.run]();
};

Creep.prototype.setRun = function (fn) {
	this.memory.run = fn;
	
	return this;
};

Creep.prototype.setAndRun = function (fn) {
	this.setRun(fn).run();
};

Room.prototype.openSpotsClosest = function (obj) {
	this.memory.spots2 = this.memory.spots2 || {};
	var posString = obj.pos.x + ',' + obj.pos.y;
	var range = 0;
	while (!this.memory.spots2[posString]) {
		
		var pp = obj.pos;

		var openSpots = this.lookAtArea(pp.y-range,pp.x-range,pp.y+range,pp.x+range, true)
		.filter(function (areaObj) {
			return areaObj.type=='terrain' && (areaObj.terrain=='plain' || areaObj.terrain=='swamp');
		})
		.map(function (areaInfo) {
			return new RoomPosition(areaInfo.x, areaInfo.y, that.name)
		});
		
		if (openSpots.length) {
			this.memory.spots2[posString] = openSpots;
		}
		
		range++;
	}
	
	return this.memory.spots2[posString];
};

Room.prototype.openSpotsNear = function(obj) {
	Memory.rooms[this.name].spots = Memory.rooms[this.name].spots || {};
	var that = this;
	var posString = obj.pos.x + ',' + obj.pos.y;
	if(!Memory.rooms[this.name].spots[posString]) {
		let pp = obj.pos;
		
		var openSpots = this.lookAtArea(pp.y-1,pp.x-1,pp.y+1,pp.x+1, true)
		.filter(function (areaObj) {
			return areaObj.type=='terrain' && (areaObj.terrain=='plain' || areaObj.terrain=='swamp');
		})
		.map(function (areaInfo) {
			return new RoomPosition(areaInfo.x, areaInfo.y, that.name)
		});
		
		Memory.rooms[this.name].spots[posString] = openSpots;
	}
	return Memory.rooms[this.name].spots[posString];
};

Room.prototype.init = function () {
	var room = this;
	
	if (room.memory.init) {
		return;
	}
	
	if (!room.controller) {
		room.memory.init = true;
		return;
	}
	
	// place a flag next to all sources
	room.memory.sourceFlags = room.memory.sourceFlags || room.find(FIND_SOURCES).reduce(function (obj, source) {
		
		var nearby = room.openSpotsNear(source);
		if (!nearby.length) {
			return obj;
		}
		
		var flag = flags.makeSource(source.mineralType, room, source.pos);
		
		if (_.isString(flag)) {
			obj[flag] = {};
			obj[flag].source = source.id;
			//obj[flag].source = nearby[0];
		} else {
			console.log('unable to make flag for source ', source.id, ':', utils.strerror(flag));
		}
		
		return obj;
	}, {});
	
	room.memory.init = true;
};

Creep.prototype.gotoThen = function () {
	var creep = this;
	var destinationInfo = creep.memory.destination;
	if (!destinationInfo) {
		console.log(creep.name + ' unknown destination:' + JSON.stringify(creep.memory));
		creep.suicide();
		return;
	}
	
	var target;
	if (destinationInfo.movingTarget) {
		target = creep[destinationInfo.movingTarget]();
	} else {
		var targetInfo = destinationInfo.target;
		target = new RoomPosition(targetInfo.x, targetInfo.y, targetInfo.roomName);
	}
	
	if (!target) {
		return;
	}
	
	var range = destinationInfo.range;
	if (creep.pos.inRangeTo(target, range)) {
		creep.setAndRun(creep.memory.destination.then);
		return;
	}
	
	creep.moveTo(target);
	
	
};

Creep.prototype.setGoing = function(target, then, range, movingTarget) {
	var creep = this;
	var destinationInfo = {};
	destinationInfo.target = target;
	
	if (movingTarget) {
		destinationInfo.movingTarget = movingTarget;
	}
	
	destinationInfo.range = range;
	destinationInfo.then = then;
	creep.memory.destination = destinationInfo;
	
	this.setRun('gotoThen');
	
};

Room.prototype.findCircumCentre = function (things) {


};

Room.prototype.findIncentre = function (things) {

};

Room.prototype.parseRoomName = function () {

	var name = this.name;

	var ret = {
		ud: '',
		lr: '',
		x:0,
		y:0
	};

	if (name.indexOf('N') > -1) {
		ret.ud = 'N';
	}

	if (name.indexOf('S') > -1) {
		ret.ud = 'S';
	}

	if (name.indexOf('E') > -1) {
		ret.lr = 'E';
	}

	if (name.indexOf('W') > -1) {
		ret.lr = 'W';
	}

	var pos = name.slice(1).split(ret.ud);
	ret.x = pos[0];
	ret.y = pos[1];

	return ret;
};

Room.prototype.isAdjacentRoom = function (room) {
	if (typeof room === 'string') {
		room = Game.rooms[room];
	}

	var exits = Game.map.describeExits(this.name);
	var adjacent = Object.keys(exits).reduce((b, d) => b || exits[d] === room.name, false);

	return adjacent;
};

// take a resource from anything else
Creep.prototype.takeResource = function (target, resource, amount) {
	if (typeof target === 'string') {
		target = Game.getObjectById(target);
	}

	if (target instanceof Mineral ||
		target instanceof Source) {
			return this.harvest(target);
	}

	if (target instanceof Resource) {
		return this.pickup(target);
	}

	if (target instanceof StructureContainer ||
		target instanceof StructureTerminal ||
		target instanceof StructureStorage ||
		target instanceof StructureLab ||
		target instanceof Creep) {
			return target.transfer(this, resource, amount);
	}

	if (target instanceof StructurePowerSpawn ||
		target instanceof StructureExtension ||
		target instanceof StructureTower ||
		target instanceof StructureSpawn ||
		target instanceof StructureLink) {
			return target.transferEnergy(this, amount);
	}

	return ERR_INVALID_TARGET;
};

RoomPosition.prototype.findNearestThing = function (findFunction) {

	var roomsToSee = [this.roomName];
	var roomsSeen = {};
	var target;

	while (!target && roomsToSee.length) {
		var room = Game.rooms[roomsToSee.shift()];
		roomsSeen[room] = true;

		target = findFunction(room);

		// prep next room;
		var exits = Game.map.describeExits(room.name);
		roomsToSee = Object.keys(exits).reduce(function (arr, name) {
			if (Game.rooms[name] && !roomsSeen[name]) {
				a.push(n);
			}
			return arr;
		}, roomsToSee);
	}

	return target;
};
RoomPosition.prototype.findNearestSource = function (resource, min) {
	var pos = this;
	min = min || 0;
	var nearestSource = pos.findNearestThing(function (room) {
		var sources = [];

		sources = room.find(FIND_DROPPED_RESOURCES, {filter: r => r.resourceType === resource && r.amount >= min}).reduce(cat, sources);
		sources = room.find(FIND_STRUCTURES, {filter: s=> (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) && s.store[resource] && s.store[resource] >= min}).reduce(cat, sources);

		if (!sources.length) {
			if (resource === RESOURCE_ENERGY) {
				sources = room.find(FIND_SOURCES, {filter: s => s.energy >= min}).reduce(cat, sources);
			} else {
				sources = room.find(FIND_MINERALS, { filter: s => s.mineralAmount && s.mineralType === resource && s.mineralAmount >= min}).reduce(cat, sources);
			}
		}


		return pos.findClosestByRange(sources);
	});
	
	return nearestSource;
};

RoomPosition.prototype.findNearestStructureTypes = function (types, mineOnly) {
	
	if (typeof types === 'string') {
		var typeString = types;
		types = {};
		types[typeString] = true;
	}
	
	var pos = this;
	var nearestController = pos.findNearestThing(function (room) {
		var controllers;
		if (mineOnly) {
			controllers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_CONTROLLER}});
		} else {
			controllers = room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTROLLER}});
		}

		return pos.findClosestByRange(controllers);
	});
	
	return nearestController;
};

Room.prototype.findCentroid = function (things) {
	var room = this;
	var poses = coerceToPositions(things).filter(pos => pos.roomName === room.name);

	if (!poses.length) {
		return;
	}

	var maxX, maxY;
	maxX = poses.reduce((t, p) => t + p.x, 0);
	maxY = poses.reduce((t, p) => t + p.y, 0);

	var avgX = Math.floor(maxX/poses.length);
	var avgY = Math.floor(maxY/poses.length);

	var centroid = room.getPositionAt(avgX, avgY);

	return centroid;
};

module.exports = {};