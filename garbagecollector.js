// garbagecollector.js
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('garbagecollector'); // -> 'a thing'
 */
var PriorityQueue = require('pqueue');

var gc = function () {
// Cleanup dead creeps

	Memory.creeps = Memory.creeps || {};
	Object.keys(Memory.creeps).forEach(function (name) {
		if (!Game.creeps[name]) {
			var mem = Memory.creeps[name];
			console.log('clearing memory for defunct ' + mem.genesis + ' ' + name);

			if (mem.flags && mem.flags.role) {
				try {
					Game.flags[mem.flags.role].remove();
				} catch (e) {
					console.log('unable to remove ' + name + '\'s flag:', e)
				}
			}

			if (mem.signalledDemise) {
				console.log(mem.genesis + ' ' + name + ' already signalled death, deleting memory');
				delete Memory.creeps[name];
				return;
			}

			var pos = mem.lastPos;
			pos = new RoomPosition(pos.x, pos.y, pos.roomName);
			var init = {};
			init.init = mem;
			init.genesis = mem.genesis;

			if (init.genesis === 'makeHarvester' || init.genesis === 'makeCourier') {
				var anyMiners = Game.rooms[pos.roomName].find(FIND_MY_CREEPS, {
					filter: function (creep) {
						return creep.memory.genesis === 'makeMiner'
					}
				}).length;

				if (anyMiners) {
					init.genesis = 'makeCourier';
				} else {
					init.genesis = 'makeMiner';
				}
			}
			var spawn = pos.findNearestFriendlySpawn();


			var priority;
			if (init.genesis === 'makeMiner') {
				priority = 0;
			} else {
				priority = 0;
			}
			spawn.memory.pq = new PriorityQueue(spawn.memory.pq).queue(priority, init);
			console.log('recycled ' + mem.genesis + ' ' + name + ' at ' + spawn.name);

			delete Memory.creeps[name];
		}
	});

	// Cleanup dead spawns
	Memory.spawns = Memory.spawns || {};
	var workersToSpawn = new PriorityQueue();
	Object.keys(Memory.spawns).forEach(function (name) {
		if (!Game.spawns[name]) {
			
			if (Memory.spawns[name]) {
				var spawnPQ = new PriorityQueue(Memory.spawns[name]);
				for (let creepInfo = spawnPQ.dequeue(); creepInfo; creepInfo = spawnPQ.dequeue()) {
					workersToSpawn.queue(0, creepInfo);
				}
			}
			
			delete Memory.spawns[name];
		}
	});

	// add all workers to be made at different spawns randomly (for now)
	var spawns = Object.keys(Game.spawns).map(n => Game.spawns[n]);
	var i = 0;
	if (spawns.length) {
		for (var recycleCreepInfo = workersToSpawn.dequeue(); recycleCreepInfo; recycleCreepInfo = workersToSpawn.dequeue()) {
			var spawn = spawns[i];
			spawn.memory.pq = new PriorityQueue(spawn.memory.pq).queue(0, recycleCreepInfo);
			i = (i + 1) % spawns.length;
		}
	}
	
	// Cleanup dead flags
	Memory.flags = Memory.flags || {};
	Object.keys(Memory.flags).forEach(function (name) {
		if (!Game.flags[name]) {
			//delete Memory.flags[name];
		}
	});
	Object.keys(Game.flags).forEach(function (name) {
		Memory.flags[name] = Memory.flags[name] || {};
		Memory.flags[name].room = Game.flags[name].pos.roomName;
	});
};

module.exports = gc;