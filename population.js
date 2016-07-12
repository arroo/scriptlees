// population.js
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('population'); // -> 'a thing'
 */

var flags = require('flags');
var PriorityQueue = require('pqueue');
var utils = require('utils');
var strerror = utils.strerror;
module.exports = {};
Spawn.prototype.population = function() {
//return;
	var spawn = this;
	if (spawn.spawning) {
		return;
	}

	var pq = new PriorityQueue(spawn.memory.pq);
	//console.log(JSON.stringify(pq));
	var queueItem = pq.dequeue();
	if (!queueItem) {
//        console.log(spawn.name + ' has nothing to spawn!');
	} else {
		//    console.log(JSON.stringify(creepInfo))
			var creepInfo = queueItem.item;
			var priority = queueItem.priority;
			var genesis = spawn[creepInfo.genesis];
			var name;
			if (creepInfo.genesis === 'makeHarvester' || creepInfo.genesis === 'makeCourier') {
				var anyMiners = Game.rooms[spawn.room.name].find(FIND_MY_CREEPS, {
					filter: function (creep) {
						return creep.memory.genesis === 'makeMiner'
					}
				}).length;

				if (anyMiners) {
					creepInfo.init.genesis = creepInfo.genesis = 'makeCourier';
				} else {
					creepInfo.init.genesis = creepInfo.genesis = 'makeHarvester';
				}
			}
			
			var success = false;
			try {
				name = spawn[creepInfo.genesis](creepInfo.init);
				success = _.isString(name);
			} catch (error) {
				console.log('error spawning ' + creepInfo.genesis + ':',error)
			}
			
			if (!success) {
				console.log(spawn.name + ' cannot spawning ' + creepInfo.genesis + ' ' + strerror(name));
				pq.enqueue(priority, creepInfo);
			} else {
				console.log(spawn.name + ' spawning:' +creepInfo.genesis + ' ' + name);
			}
	}

	spawn.memory.pq = pq;
	
//    console.log('after spawn loop:' + JSON.stringify(spawn.memory.pq));
	
};

