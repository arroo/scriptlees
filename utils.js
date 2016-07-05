/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils');
 * mod.thing == 'a thing'; // true
 */
var findClosestEmptyAdjacent = function (pos) {

};

var cat = function (arr, el) {
	arr.push(el);
	return arr;
};
var strerror = function (errno) {

	switch (errno) {
		case ERR_NOT_OWNER:

			return 'you are not the owner';
		case ERR_NO_PATH:

			return 'there is no path to the target';
		case ERR_BUSY:
			return 'busy';

		case ERR_NOT_FOUND:
			return 'not found';

		case ERR_NOT_ENOUGH_ENERGY:
			return 'not enough energy/resources/extensions';

		case ERR_INVALID_TARGET:
			return 'invalid target';

		case ERR_FULL:
			return 'full';

		case ERR_NOT_IN_RANGE:
			return 'not in range';

		case ERR_INVALID_ARGS:
			return 'invalid arguments';

		case ERR_TIRED:
			return 'tired';

		case ERR_NO_BODYPART:
			return 'no matching bodypart';

		case ERR_NOT_ENOUGH_EXTENSIONS:
			return 'not enough extensions';

		case ERR_RCL_NOT_ENOUGH:
			return 'not enough RCL';

		case ERR_GCL_NOT_ENOUGH:
			return 'not enough GCL';

		default:
			return 'unknown error: ' + errno;

	}
};

var coerceToPositions = function (things, keepEmpties) {

	return things.reduce(function (arr, thing) {

		var pos;
		// try to coerce thing to be a room position
		if (typeof thing === 'undefined') {
			return arr;
		} else if (thing instanceof RoomPosition) {
			thing.pos = thing;
			pos = thing;
		} else if (typeof thing === 'object') {
			if (typeof thing.x === 'number' && typeof thing.y === 'number' && typeof thing.roomName === 'string' && Game.rooms[thing.roomName]) {
				thing.pos = Game.rooms[thing.roomName].getPositionAt(thing.x, thing.y);
				pos = thing;
			} else if (thing.pos instanceof RoomPosition) {
				pos = thing;
			} else {

			}
		}

		if (pos) {

			if (thing.id) {
				pos.oid = thing.id;
			} else if (thing.name) {
				pos.oname = thing.name;
			}

			arr.push(pos);
		} else if (keepEmpties) {
			arr.push(undefined);
		}

		return arr;
	}, []);
};

var allPairs = function (arr, fn) {
	for (var i = 0; i < arr.length; i++) {
		for (var j = 0; j < arr.length; j++) {
			if (i !== j) {
				fn(arr[i], arr[j]);
			}
		}
	}
};

// this is the meat of finding minimum spanning trees
var findMinSpanningTreeSingleRoom = function (objs) {

	var seen = {};
	var weights = {};
	var posArray = objs.reduce((a, p) => {a.push(a.length); return a}, []);
	allPairs(posArray, function (a, b) {
		seen[a] = seen[a] || {};
		seen[a][b] = false;

		seen[b] = seen[b] || {};
		seen[b][a] = false;

		weights[a] = weights[a] || {};
		weights[b] = weights[b] || {};
	});

	// get weights for each vertex
	allPairs(posArray, function (a, b) {
		if (seen[a][b] || seen[b][a]) {
			return;
		}

		seen[a][b] = seen[b][a] = true;

		var baseSpot = objs[a].pos;
		var testSpot = objs[b].pos;

		var path = baseSpot.findPathTo(testSpot, {ignoreCreeps : true, ignoreDestructibleStructures: true});
		if (!path || !path.length) {
			path = testSpot.findPathTo(baseSpot, {ignoreCreeps : true, ignoreDestructibleStructures: true});
		}

		if (!path || !path.length) {
			return;
		}

		var weight = path.length;

		weights[a][b] = weights[b][a] = weight;
	});

	// flatten pairings to weights
	var sortedWeightPairings = Object.keys(weights).reduce(function (arr, a) {

		arr = Object.keys(weights[a]).reduce(function (arr, b) {
			var weightObj = {};
			weightObj.a = a;
			weightObj.b = b;
			weightObj.weight = weights[a][b] || weights[b][a];

			arr.push(weightObj);
			return arr;
		}, arr);

		return arr;
	}, []).sort((a, b) => a.weight - b.weight);

	var nodesSeen = {};
	nodesSeen[posArray[0]] = true;
	var notInf = posArray.length+1;
	var mst = {};
	while (posArray.length !== Object.keys(nodesSeen).length && notInf--) {

		for (let i = 0; i < sortedWeightPairings.length; i++) {
			var a = Number(sortedWeightPairings[i].a);
			var b = Number(sortedWeightPairings[i].b);
			let newNode;
			if (nodesSeen[a] && !nodesSeen[b]) {

				newNode = b;
			}
			if (nodesSeen[b] && !nodesSeen[a]) {
				newNode = a;
			}


			if (newNode) {

				mst[a] = mst[a] || {};
				mst[a][b] = sortedWeightPairings[i].weight;
				mst[b] = mst[b] || {};
				mst[b][a] = sortedWeightPairings[i].weight;

				// this only works if the whole graph is connected
				nodesSeen[newNode] = true;
				break;
			} else {

			}
		}

	}


	return mst;
};

var findMinSpanningTree = function (things) {
	var objs = coerceToPositions(things);
	var roomPositions = objs.reduce(function (roomPos, obj) {
		if (obj) {
			roomPos[obj.pos.roomName] = roomPos[obj.pos.roomName] || [];
			roomPos[obj.pos.roomName].push(obj);
		}

		return roomPos;
	}, {});

	var adjacentRooms = [];

	allPairs(Object.keys(roomPositions), function (a, b) {
		if (Game.rooms[a].isAdjacentRoom(Game.rooms[b])) {
			let dummyObj = {};
			dummyObj.pos = Game.rooms[b].openSpotsClosest(Game.rooms[b].getPositionAt(25,25));
			roomPositions[a].push(dummyObj);
			adjacentRooms.push([a, b]);
		}
	});

	// find mst for each room
	var roomMSTs = 	Object.keys(roomPositions).reduce(function (mst, name) {
		
		mst[name] = findMinSpanningTreeSingleRoom(roomPositions[name]);

		return mst;
	}, {});

	// combine adjacent rooms to get full map
	adjacentRooms.forEach(function (a, b) {
		var aLink = roomPositions[a].reduce(function (obj, pos) {
			if (obj) {
				return obj;
			}

			obj = 1;

			return obj;
		}, undefined);
	});

	console.log(JSON.stringify(roomMSTs));

	return roomMSTs;
};

module.exports = {
	'strerror': strerror,
	'cat': cat,
	'findMinSpanningTree': findMinSpanningTree,
	'coerceToPositions': coerceToPositions
};