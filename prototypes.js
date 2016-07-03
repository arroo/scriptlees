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

Room.prototype.openSpotsNear = function(obj) {
	Memory.rooms[this.name].spots = Memory.rooms[this.name].spots || {};
	var that = this;
	if(!Memory.rooms[this.name].spots[obj.id]) {
		let pp = obj.pos;
		
		var openSpots = this.lookAtArea(pp.y-1,pp.x-1,pp.y+1,pp.x+1, true)
		.filter(function (areaObj) {
			return areaObj.type=='terrain' && (areaObj.terrain=='plain' || areaObj.terrain=='swamp');
		})
		.map(function (areaInfo) {
			return new RoomPosition(areaInfo.x, areaInfo.y, that.name)
		});
		
		Memory.rooms[this.name].spots[obj.id] = openSpots;
	}
	return Memory.rooms[this.name].spots[obj.id];
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

Room.prototype.findCircumCentre = function (things) {


};

Room.prototype.findIncentre = function (things) {

};

var parseRoomName = function (name) {
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

	if (!room) {
		return false;
	}

	var myInfo = parseRoomName(this.name);
	var testInfo = parseRoomName(room.name);

	if (myInfo.ud !== testInfo.ud) {
		testInfo.y = 0 - (testInfo.y + 1);
	}
	if (myInfo.lr !== testInfo.lr) {
		testInfo.x = 0 - (testInfo.x + 1);
	}

	var dx = Math.abs(myInfo.x - testInfo.x);
	var dy = Math.abs(myInfo.y - testInfo.y);

	if (dx === 0) {
		return dy === 1;
	}

	if (dy === 0) {
		return dx === 1;
	}

	return false;
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