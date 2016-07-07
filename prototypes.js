/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('prototypes');
 * mod.thing == 'a thing'; // true
 */

var PriorityQueue = require('pqueue');
var flags = require('flags');
var utils = require('utils');
var cat = utils.cat;
var coerceToPositions = utils.coerceToPositions;
Source.prototype.mineralType = RESOURCE_ENERGY;

var OBSTACLE_OBJECT_TYPES_OBJ;
var STALL_LIMIT = 5;

var directionOpposites = {};
directionOpposites[TOP_LEFT] = [BOTTOM_RIGHT, BOTTOM, RIGHT, BOTTOM_LEFT, TOP_RIGHT, LEFT, TOP];
directionOpposites[TOP] = [BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, LEFT, RIGHT, TOP_LEFT, TOP_RIGHT];
directionOpposites[TOP_RIGHT] = [BOTTOM_LEFT, LEFT, BOTTOM, TOP_LEFT, BOTTOM_RIGHT, TOP, RIGHT];
directionOpposites[RIGHT] = [LEFT, TOP_LEFT, BOTTOM_LEFT, TOP, BOTTOM, TOP_RIGHT, BOTTOM_RIGHT];
directionOpposites[BOTTOM_RIGHT] = [TOP_LEFT, TOP, LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM, RIGHT];
directionOpposites[BOTTOM] = [TOP, TOP_LEFT, TOP_RIGHT, LEFT, RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT];
directionOpposites[BOTTOM_LEFT] = [TOP_RIGHT, TOP, RIGHT, TOP_LEFT, BOTTOM_RIGHT, LEFT, BOTTOM];
directionOpposites[LEFT] = [RIGHT, TOP_RIGHT, BOTTOM_RIGHT, TOP, BOTTOM, TOP_LEFT, BOTTOM_LEFT];

var directionStrings = {};
directionStrings[TOP] = 'TOP';
directionStrings[BOTTOM] = 'BOTTOM';
directionStrings[LEFT] = 'LEFT';
directionStrings[RIGHT] = 'RIGHT';
directionStrings[TOP_LEFT] = 'TOP_LEFT';
directionStrings[TOP_RIGHT] = 'TOP_RIGHT';
directionStrings[BOTTOM_LEFT] = 'BOTTOM_LEFT';
directionStrings[BOTTOM_RIGHT] = 'BOTTOM_RIGHT';

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
			return new RoomPosition(areaInfo.x, areaInfo.y, obj.name)
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
			return new RoomPosition(areaInfo.x, areaInfo.y, obj.name)
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

	var nearestSpawn = room.getPositionAt(25,25).findNearestFriendlySpawn();
	if (nearestSpawn) {
		nearestSpawn.memory.pq = Object.keys(room.memory.sourceFlags).reduce(function (pq, flagName) {
			var creepInfo = {};
			creepInfo.genesis = 'makeMiner';
			creepInfo.init = {};
			creepInfo.init.flag = flagName;
			
			return pq.queue(5, creepInfo);	
		}, new PriorityQueue(nearestSpawn.memory.pq));
	}

	room.memory.init = true;
};

RoomPosition.prototype.isWalkable = function () {
	OBSTACLE_OBJECT_TYPES_OBJ = OBSTACLE_OBJECT_TYPES_OBJ || OBSTACLE_OBJECT_TYPES.reduce((o, t) => {o[t] = true; return o;}, {});

	var notWalkable = this.look().some(o => o.type === LOOK_STRUCTURES && OBSTACLE_OBJECT_TYPES_OBJ[o.structure.structureType] || o.type === LOOK_TERRAIN && OBSTACLE_OBJECT_TYPES_OBJ[o.terrain]);
	return !notWalkable;
};

RoomPosition.prototype.inDirection = function (direction) {
	var x = this.x;
	var y = this.y;

	// move in x coords
	if (direction === TOP_LEFT || direction === LEFT || direction === BOTTOM_LEFT) {
		x--;

	} else if (direction === TOP_RIGHT || direction === RIGHT || direction === BOTTOM_RIGHT) {
		x++;
	}

	// move in y coords
	if (direction === TOP_LEFT || direction === TOP || direction === TOP_RIGHT) {
		y--;

	} else if (direction === BOTTOM_LEFT || direction === BOTTOM || direction === BOTTOM_RIGHT) {
		y++;
	}

	var pos;
	// make sure direction is actually different
	if (x !== this.x || y !== this.y) {
		pos = Game.rooms[this.roomName].getPositionAt(x, y);
	}

	return pos;
};

Creep.prototype.gotoThen = function () {
	var creep = this;
	var destinationInfo = creep.memory.destination;
	if (!destinationInfo) {
		console.log(creep.name + ' unknown destination:' + JSON.stringify(creep.memory));
		creep.suicide();
		return;
	}

	creep.memory.stalled = creep.memory.stalled || 0;

	if (creep.pos.x === creep.memory.lastPos.x &&
		creep.pos.y === creep.memory.lastPos.y &&
		creep.pos.roomName === creep.memory.lastPos.roomName) {
		if (!creep.memory.tired) {
			creep.memory.stalled++;
		}
	} else {
		creep.memory.stalled = 0;
	}

	var avoidCreeps = true;
	var pathReuse = 50;

	var target;
	if (creep.memory.stalled >= STALL_LIMIT) {
		creep.log('congested');
		var congestedCreeps =  creep.pos.findCrowdedCreeps();
		var trafficCentre = creep.room.findCentroid(congestedCreeps);
		// cache solutions for later during this tick
		Memory.congestionSites = congestedCreeps.reduce((o, c) => {o[c.pos.getPosString()] = trafficCentre; return o}, Memory.congestionSites);
		var avoidDirection = creep.pos.getDirectionTo(trafficCentre);
		if (avoidDirection) {

			var goodDirection;
			var goodDirections = directionOpposites[avoidDirection].slice();

			while (!goodDirection && goodDirections.length) {
				var testDirection = goodDirections.shift();
				var directionSpot = creep.pos.inDirection(testDirection);

				if (directionSpot && directionSpot.isWalkable()) {
					goodDirection = testDirection;
				}
			}

			if (goodDirection) {
				creep.memory.tired = creep.move(goodDirection) === ERR_TIRED;
			}

			return;
		}

		avoidCreeps = false;
		pathReuse = congestedCreeps.length * 2;
	}

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
		creep.memory.stalled = 0;
		creep.setAndRun(creep.memory.destination.then);
		return;
	}

	creep.memory.tired = creep.moveTo(target, {'reusePath':pathReuse, 'avoidCreeps': avoidCreeps}) === ERR_TIRED;

};

RoomPosition.prototype.getPosString = function () {
	return this.x + ',' + this.y + ',' + this.roomName;
};

RoomPosition.prototype.findCrowdedCreeps = function () {

	var posString = this.getPosString();
	var cachedCongestion = Memory.congestionSites[posString];
	if (cachedCongestion) {
		return [new RoomPosition(cachedCongestion.x, cachedCongestion.y, cachedCongestion.roomName)];
	}

	var roomName = this.roomName;
	var room = Game.rooms[roomName];
	var positionsToSearch = [this];
	var positionsSearched = {};
	positionsSearched[posString] = true;
	var creepsFound = [];

	for (var pos = positionsToSearch.pop(); pos; pos = positionsToSearch.pop()) {

		var creeps = pos.lookFor(LOOK_CREEPS);

		if (!creeps.length) {
			continue;
		}

		creepsFound = creeps.reduce(cat, creepsFound);

		var x = pos.x;
		var y = pos.y;

		var surroundingPositions = [
			[x-1, y-1],
			[x-1, y],
			[x-1, y+1],
			[x, y-1],
			[x, y+1],
			[x+1, y-1],
			[x+1, y],
			[x+1, y+1]
		];

		positionsToSearch = surroundingPositions.reduce(function (arr, posArr) {
			var pos = room.getPositionAt(posArr[0], posArr[1]);

			if (pos && !positionsSearched[pos.getPosString()]) {
				arr.push(pos);
			}

			return arr;

		}, positionsToSearch);

		positionsSearched = surroundingPositions.reduce(function (obj, posArr) {
			var pos = room.getPositionAt(posArr[0], posArr[1]);

			if (pos) {
				obj[pos.getPosString()] = true;
			}

			return obj;
		}, positionsSearched);
	}

	return creepsFound;
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
		roomsSeen[room.name] = true;

		target = findFunction(room);

		// prep next room;
		var exits = Game.map.describeExits(room.name);
		roomsToSee = Object.keys(exits).reduce(function (arr, direction) {
			var name = exits[direction];
			if (Game.rooms[name] && !roomsSeen[name]) {
				arr.push(name);
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

Creep.prototype.log = function () {
	var creepClass = this.memory.genesis || 'unknown role';
	var name = this.name;
	[].unshift.call(arguments, creepClass + ' ' + name + ': ');
	console.log.apply(console, arguments);
};

Creep.prototype.signalRespawn = function (init, spawn) {
	var creep = this;
	
	var mem = creep.memory;
	var pos = creep.pos;

	var creepInit = {};
	creepInit.init = init;
	creepInit.genesis = mem.genesis;

	if (typeof spawn === 'string') {
		spawn = Game.getObjectById(spawn);
	}
	
	if (!(spawn && spawn instanceof StructureSpawn)) {
		spawn = pos.findNearestFriendlySpawn();
	}
	
	if (!spawn) {
		return;
	}

	// don't set the highest priority for some reason?
	var priority = 0;
	spawn.memory.pq = new PriorityQueue(spawn.memory.pq).queue(priority, creepInit);

	creep.memory.signalledDemise = true;
	
};

RoomPosition.prototype.findNearestFriendlySpawn = function () {
	var pos = this;

	var nearestFriendlySpawn = pos.findNearestThing(function (room) {
		var friendlySpawns = room.find(FIND_MY_SPAWNS);

		if (friendlySpawns) {
			return new RoomPosition(25, 25, room.name).findClosestByRange(friendlySpawns);
		}
	});

	return nearestFriendlySpawn;
};

Room.prototype.findCentroid = function (things) {
	var room = this;
	var poses = coerceToPositions(things).map(o => o.pos).filter(pos => pos.roomName === room.name);

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

Creep.prototype.basicCreepRespawn = function (init) {
	var creep = this;
	//var rangeToSpawn = creep.pos.getRangeTo(spawn);
	var estimatedTickCost = creep.body.length * CREEP_SPAWN_TIME;
	var ticksToReplace = /*rangeToSpawn +*/ 25 + estimatedTickCost;
	if (ticksToReplace > creep.ticksToLive && !creep.memory.signalledDemise) {
		creep.log('signalling respawn to spawn ' + 'random spawn');
		creep.signalRespawn(init);
	}
};

module.exports = {};