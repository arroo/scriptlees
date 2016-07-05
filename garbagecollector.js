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
			var spawn = pos.findClosestByRange(Object.keys(Game.spawns).map(function (name) {
				return Game.spawns[name]
			}));


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
	Object.keys(Memory.spawns).forEach(function (name) {
		if (!Game.spawns[name]) {
			delete Memory.spawns[name];
		}
	});

	// Cleanup dead flags
	/*Object.keys(Memory.flags).forEach(function (name) {
		if (!Game.flags[name]) {
			delete Memory.flags[name];
		}
	});*/
};

module.exports = gc;