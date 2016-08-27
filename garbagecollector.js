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
		try {
		if (!Game.creeps[name]) {
			var mem = Memory.creeps[name];
			console.log('clearing memory for defunct ' + mem.genesis + ' ' + name);

			if (mem.flags && mem.flags.role) {
				try {
					delete Memory.flags[mem.flags.role];
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
			try {
				pos = new RoomPosition(pos.x, pos.y, pos.roomName);
			} catch (e) {
				pos = new RoomPosition(25, 25, 'W43N43'); // temp
			}
			var init = {};
			init.init = mem;
			init.genesis = mem.genesis;

			if (init.genesis === 'makeHarvester' || init.genesis === 'makeCourier') {
				//var anyMiners = new RoomPosition();
				var anyMiners;
				try {
					anyMiners = Game.rooms[pos.roomName].find(FIND_MY_CREEPS, {
						filter: function (creep) {
							return creep.memory.genesis === 'makeMiner'
						}
					}).length;
				} catch (err) {
				}

				if (anyMiners) {
					init.genesis = 'makeCourier';
				} else {
					init.genesis = 'makeHarvester';
				}
			}

			if (init.genesis === 'makeClaimer' || init.genesis === 'makeUpgrader') {
				let roomMine = false;
				try {
					roomMine = Game.rooms[mem.room].controller.my;
				} catch (error) {
				}
				if (roomMine) {
					init.genesis = 'makeUpgrader';
				} else {
					init.genesis = 'makeClaimer';
				}
			}

			var spawn = pos.findNearestFriendlySpawn() || Game.spawns.Spawn1;


			var priority;
			switch (init.genesis) {
				case 'makeRepairer':
					priority = 5;
					break;
				case 'makeBuilder':
					priority = 4;
					break;
				case 'makeClaimer':
				case 'makeUpgrader':
					priority = 3;
					break;
				case 'makeMiner':
					priority = 2;
					break;
				case 'makeCourier':
				case 'makeHarvester':
					priority = 1;
					break;
				default:
					priority = 4;
					break;
			}

			spawn.room.memory.pq = new PriorityQueue(spawn.memory.pq).enqueue(priority, init);
			console.log('recycled ' + mem.genesis + ' ' + name + ' at ' + spawn.name);

			delete Memory.creeps[name];
		}
	} catch (err) {
		console.log('error respawning creep:' + err.stack);
	}
	});

	// Cleanup dead spawns
	Memory.spawns = Memory.spawns || {};
	var workersToSpawn = new PriorityQueue();
	Object.keys(Memory.spawns).forEach(function (name) {
		if (!Game.spawns[name] ||
		Game.spawns[name].memory.pq) { // temporary fix to get spawns to not have queues
			
			if (Memory.spawns[name] && Memory.spawns[name].pq) {
				var spawnPQ = new PriorityQueue(Memory.spawns[name].pq);
				for (let queueItem = spawnPQ.dequeue(); queueItem; queueItem = spawnPQ.dequeue()) {
					workersToSpawn.enqueue(queueItem.priority, queueItem.item);
				}
			}
			
			delete Memory.spawns[name];
		}
	});

	// clear open spots cache periodically
	if (Game.time % 1000 === 0) {
		Object.keys(Memory.rooms).forEach(r => Memory.rooms[r].spots = {})
	}
	// add all workers to be made at different spawns randomly (for now)
	var spawns = Object.keys(Game.spawns).map(n => Game.spawns[n]);
	var i = 0;
	if (spawns.length) {
		for (var recycleQueueItem = workersToSpawn.dequeue(); recycleQueueItem; recycleQueueItem = workersToSpawn.dequeue()) {
			var spawn = spawns[i];
			spawn.room.memory.pq = new PriorityQueue(spawn.room.memory.pq).enqueue(recycleQueueItem.priority, recycleQueueItem.item);
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
		//Memory.flags[name].room = Game.flags[name].pos.roomName;
	});
};

module.exports = gc;