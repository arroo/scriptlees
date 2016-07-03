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
		let res = this.lookAtArea(pp.y-1,pp.x-1,pp.y+1,pp.x+1);
		
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

Room.prototype.coerceToPositions = function (things) {
	var room = this;

	return things.reduce(function (arr, thing) {

		var pos;
		// try to coerce thing to be a room position
		if (typeof thing === 'undefined') {
			return arr;
		} else if (thing instanceof RoomPosition) {
			pos = thing;
		} else if (typeof thing === 'object') {
			if (typeof thing.x === 'number' && typeof thing.y === 'number') {
				pos = room.getPositionAt(thing.x, thing.y);
			} else if (thing.pos instanceof RoomPosition) {
				pos = thing.pos;
			} else {

			}
		}

		if (pos) {
			arr.push(pos);
		}

		return arr;
	}, []);
};

Room.prototype.findCentroid = function (things) {
	var room = this;
	var poses = room.coerceToPositions(things)
	.filter(pos => pos.roomName === room.name);

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