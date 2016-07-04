// init.js
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('init'); // -> 'a thing'
 */

// Check for the initialization flag
var PriorityQueue = require('pqueue');

if (!Memory.init) {
	
	var initialCreeps = [
		{'priority':4,'item':{'genesis':'makeMiner', 'init':{'flag':'Flag1'}}},
		{'priority':2,'item':{'genesis':'makeMiner', 'init':{'flag':'Flag2'}}},
		//{'priority':1,'item':{'genesis':'makeMiner', 'init':{'flag':'Flag3'}}},
		//{'priority':1,'item':{'genesis':'makeMiner', 'init':{'flag':'Flag4'}}},
		{'priority':1,'item':{'genesis':'makeHarvester', 'init':{}}},
		{'priority':3,'item':{'genesis':'makeBuilder', 'init':{}}},
		{'priority':1,'item':{'genesis':'makeHarvester', 'init':{}}},
		{'priority':3,'item':{'genesis':'makeBuilder', 'init':{}}},
		{'priority':1,'item':{'genesis':'makeHarvester', 'init':{}}},
		{'priority':3,'item':{'genesis':'makeBuilder', 'init':{}}},
		{'priority':5,'item':{'genesis':'makeRepairer', 'init':{}}},
		{'priority':5,'item':{'genesis':'makeRepairer', 'init':{}}},
		{'priority':5,'item':{'genesis':'makeRepairer', 'init':{}}}
	];
	// Set the initialization flag
	Memory.init = true;
	Object.keys(Game.rooms).forEach(function (name) {
		var room = Game.rooms[name];
		room.memory.init = false;
	});
	
	Game.spawns.Spawn1.memory.pq = initialCreeps.reduce(function (pq, creepInfo) {
		return pq.queue(creepInfo);
	}, new PriorityQueue());
	console.log(JSON.stringify(Game.spawns.Spawn1.memory.pq));
}

Object.keys(Game.rooms).forEach(function (name) {
	var room = Game.rooms[name];
	if (room.memory.init) {
		return;
	}
	room.init();
});

