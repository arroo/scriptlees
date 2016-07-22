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

var CRIT = 0;
var WARN = 1;
var INFO = 2;
var DEBUG = 3;
var VERBOSE = 4;

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
	try{
		if (Memory.showFlags) {
			this.moveRoleFlag();
		}
	}catch(e) {
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
	return obj.pos.openSpotsNear();
};

RoomPosition.prototype.openSpotsNear = function () {
	var posString = this.x + ',' + this.y;
	Memory.rooms[this.roomName].spots = Memory.rooms[this.roomName].spots || {};
	Memory.rooms[this.roomName].spots[posString] = Memory.rooms[this.roomName].spots[posString] ||
			Game.rooms[this.roomName].lookAtArea(this.y-1, this.x-1, this.y+1, this.x+1, true).
				filter(a => a.type === 'terrain' && (a.terrain === 'plain' || a.tarrain === 'swamp')).
				map(a => new RoomPosition(a.x, a.y, this.roomName));

	return Memory.rooms[this.roomName].spots[posString].map(s => new RoomPosition(s.x, s.y, this.roomName));
};

Room.prototype.init = function () {
	var room = this;
	
	if (room.memory.init) {
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

	if (!room.controller) {
		room.memory.init = true;
		return;
	}

	var nearestSpawn;// = room.getPositionAt(25,25).findNearestFriendlySpawn();
	if (nearestSpawn) {
		nearestSpawn.memory.pq = Object.keys(room.memory.sourceFlags).reduce(function (pq, flagName) {
			var creepInfo = {};
			creepInfo.genesis = 'makeMiner';
			creepInfo.init = {};
			creepInfo.init.flag = flagName;
			
			return pq.enqueue(5, creepInfo);	
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
	} else if (destinationInfo.target) {
		var targetInfo = destinationInfo.target;
		target = new RoomPosition(targetInfo.x, targetInfo.y, targetInfo.roomName);
	} else if (creep.memory.genesis === 'makeCourier') {
		creep.memory.destination.movingTarget ='movingTargetCourier';
	}

	if (!target) {
		return;
	}

	var range = destinationInfo.range;
	if (creep.pos.inRangeTo(target, range) && creep.pos.x !== 0 && creep.pos.y !== 0  && creep.pos.x !== 49 && creep.pos.y !== 49) {
		creep.memory.stalled = 0;
		creep.setAndRun(creep.memory.destination.then);
		return;
	}

	var clipping = creep.memory.clipping;
	creep.memory.tired = creep.moveTo(target, {'reusePath':pathReuse, 'avoidCreeps': avoidCreeps,'ignoreDestructibleStructures':clipping}) === ERR_TIRED;

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

var cachedDescribeExits = function (name) {

	Memory.rooms = Memory.rooms || {};
	Memory.rooms[name] = Memory.rooms[name] || {};
	Memory.rooms[name].exits = Memory.rooms[name].exits || Game.map.describeExits(name);

	return Memory.rooms[name].exits;
};

Room.prototype.isAdjacentRoom = function (room) {
	if (typeof room === 'string') {
		room = Game.rooms[room];
	}

	var exits = cachedDescribeExits(this.name);
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

	// new withdraw behaviour
	if (target instanceof Structure) {
		return this.withdraw(target, resource, amount);
	}

	if (target instanceof StructureContainer ||
		target instanceof StructureTerminal ||
		target instanceof StructureStorage ||
		target instanceof StructureLab ||
		target instanceof Creep) {
			return this.withdraw(target, resource, amount);
	}

	if (target instanceof StructurePowerSpawn ||
		target instanceof StructureExtension ||
		target instanceof StructureTower ||
		target instanceof StructureSpawn ||
		target instanceof StructureLink) {
			return this.withdraw(target, resource, amount);
	}

	return ERR_INVALID_TARGET;
};

RoomPosition.prototype.findNearestThing = function (findFunction) {

	var getEntrancePosition = function (direction, name) {
		direction = directionOpposites[direction][0];
		var x;
		// get x coord for new room
		switch(direction) {
			case TOP_RIGHT:
			case BOTTOM_RIGHT:
			case RIGHT:
				x = 49;
				break;
			case TOP_LEFT:
			case BOTTOM_LEFT:
			case LEFT:
				x = 1;
				break;
			default:
				x = 25;
		}

		var y;
		// get y coord for new room
		switch(direction) {
			case BOTTOM_LEFT:
			case BOTTOM_RIGHT:
			case BOTTOM:
				y = 49;
				break;
			case TOP_LEFT:
			case TOP_RIGHT:
			case TOP:
				y = 1;
				break;
			default:
				y = 25;
		}
		
		return new RoomPosition(x, y, name);
	};

	var roomsToSee = [[this.roomName, this]];
	var roomsSeen = {};
	var target;

	while (!target && roomsToSee.length) {
		var posInfo = roomsToSee.shift();
		var room = Game.rooms[posInfo[0]];
		if (!room) {
			if(typeof (room = _.find(Object.keys(Game.rooms), n => !roomsSeen[n])) === 'undefined') {
				continue;
			}
			room = Game.rooms[room]
		}
		var pos = posInfo[1];
		pos.roomName = room.name;
		roomsSeen[room.name] = true;

		target = findFunction.call(pos, room);

		// prep next room;
		var exits = cachedDescribeExits(room.name);
		roomsToSee = Object.keys(exits).reduce(function (arr, direction) {
			var name = exits[direction];
			if (Game.rooms[name] && !roomsSeen[name]) {

				arr.push([name, getEntrancePosition(direction, name)]);
			}
			return arr;
		}, roomsToSee);
	}

	return target;
};

RoomPosition.prototype.getRoom = function () {
	return Game.rooms[this.roomName];
};

RoomPosition.prototype.fullySurrounded = function () {

	//console.log('looking for unoccupied spots around:' + JSON.stringify(this))
	var spots = this.openSpotsNear();

	return !spots.some(function (spot) {
		var w = spot.isWalkable();
		var c = !!spot.lookFor(LOOK_CREEPS).length;
		var r = (w && !c);

		//console.log('looking at ' + JSON.stringify(spot) + ': walkable:' + w + ', occupied:' + c + ', result:' + r)

		return r;
	});

	return !this.openSpotsNear().some(s => s.isWalkable() && !s.lookFor(LOOK_CREEPS).length);
};

RoomPosition.prototype.findNearestSource = function (resource, min, ignoreSources) {
	var pos = this;
	min = min || 0;
	var nearestSource = pos.findNearestThing(function (room) {
		var sources = [];

		sources = room.find(FIND_DROPPED_RESOURCES, {filter: r => r.resourceType === resource && r.amount >= min && !r.pos.fullySurrounded()}).reduce(cat, sources);
		sources = room.find(FIND_STRUCTURES, {filter: s=> (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) && s.store[resource] && s.store[resource] >= min && !s.pos.fullySurrounded()}).reduce(cat, sources);

		if (!sources.length && !ignoreSources) {
			if (resource === RESOURCE_ENERGY) {
				sources = room.find(FIND_SOURCES, {filter: s => s.energy >= min && !s.pos.fullySurrounded()}).reduce(cat, sources);
			} else {
				sources = room.find(FIND_MINERALS, { filter: s => s.mineralAmount && s.mineralType === resource && s.mineralAmount >= min && !s.pos.fullySurrounded()}).reduce(cat, sources);
			}
		}


		return this.findClosestByRange(sources);
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

		return this.findClosestByRange(controllers);
	});
	
	return nearestController;
};

Creep.prototype.log = function () {
	var creepClass = this.memory.genesis || 'unknown role';
	var name = this.name;
	[].unshift.call(arguments, creepClass + ' ' + name + ': ');
	console.log.apply(console, arguments);
};

Creep.prototype.debug = function () {
	if (!this.memory.logLevel > DEBUG) {
		return;
	}
	var creepClass = this.memory.genesis || 'unknown role';
	var name = this.name;

	[].unshift.call(arguments, `D ${creepClass} ${name}: `);
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
	spawn.memory.pq = new PriorityQueue(spawn.memory.pq).enqueue(priority, creepInit);

	creep.memory.signalledDemise = true;
	
};

RoomPosition.prototype.findNearestFriendlySpawn = function () {
	var pos = this;

	var nearestFriendlySpawn = pos.findNearestThing(function (room) {
		var friendlySpawns = room.find(FIND_MY_SPAWNS);

		if (friendlySpawns) {
			return this.findClosestByRange(friendlySpawns);
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

Room.prototype.find2 = (function (mem) {
	var find = Room.prototype.find;
	var closure = function (type, obj) {

		var tick = Game.time;
		mem[tick] = mem[tick] || {};
		mem[tick][type] = mem[tick][type] || find.call(this, type);

		var result;
		if (typeof obj === 'object' && obj.filter) {
			result = _.filter(mem[tick][type], obj.filter);

		} else {
			result = _.clone(mem[tick][type]);
		}

		return result;
	};
	return closure;
})({});
/*

 original Room.prototype.find()
var t = function (type, opts) {
	var result = [];
	opts = opts || {};
	if (register.findCache[type] && register.findCache[type][this.name]) {
		result = register.findCache[type][this.name];
	} else {
		switch (type) {
			case C.FIND_EXIT:
				register.findCache[type] = register.findCache[type] || {};
				register.findCache[type][this.name] = this.find(C.FIND_EXIT_TOP, opts).concat(this.find(C.FIND_EXIT_BOTTOM, opts)).concat(this.find(C.FIND_EXIT_RIGHT, opts)).concat(this.find(C.FIND_EXIT_LEFT, opts));
				return _.clone(register.findCache[type][this.name]);
			case C.FIND_EXIT_TOP:
			case C.FIND_EXIT_RIGHT:
			case C.FIND_EXIT_BOTTOM:
			case C.FIND_EXIT_LEFT:

				register.findCache[type] = register.findCache[type] || {};

				var exits = [];
				for (var i = 0; i < 50; i++) {
					var x = 0,
						y = 0;
					if (type == C.FIND_EXIT_LEFT || type == C.FIND_EXIT_RIGHT) {
						y = i;
					} else {
						x = i;
					}
					if (type == C.FIND_EXIT_RIGHT) {
						x = 49;
					}
					if (type == C.FIND_EXIT_BOTTOM) {
						y = 49;
					}
					exits.push(!(runtimeData.staticTerrainData[this.name][y * 50 + x] & C.TERRAIN_MASK_WALL));
				}
				result = _.reduce(exits, (accum, i, key) => {
					if (i) {
						if (type == C.FIND_EXIT_TOP) {
							accum.push(this.getPositionAt(key, 0));
						}
						if (type == C.FIND_EXIT_BOTTOM) {
							accum.push(this.getPositionAt(key, 49));
						}
						if (type == C.FIND_EXIT_LEFT) {
							accum.push(this.getPositionAt(0, key));
						}
						if (type == C.FIND_EXIT_RIGHT) {
							accum.push(this.getPositionAt(49, key));
						}
					}
					return accum;
				}, []);

				register.findCache[type][this.name] = result;

				break;
		}
	}

	if (opts.filter) {
		result = _.filter(result, opts.filter);
	} else {
		result = _.clone(result);
	}

	return result;
}
*/

Creep.prototype.isCombat = function () {
	switch (this.memory.genesis) {
		case 'makeSiege':
		case 'makeMelee':
		case 'makeCleric':
			return true;
		
		default:
			return false;
	}
};
module.exports = {};
