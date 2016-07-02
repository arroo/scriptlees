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

module.exports = {};
Spawn.prototype.population = function() {
//return;
	var spawn = this;
	if (spawn.spawning) {
		return;
	}

	var pq = new PriorityQueue(spawn.memory.pq);
	//console.log(JSON.stringify(pq));
	var creepInfo = pq.dequeue();
	if (!creepInfo) {
//        console.log(spawn.name + ' has nothing to spawn!');
	} else {
		//    console.log(JSON.stringify(creepInfo))
			var genesis = spawn[creepInfo.genesis];
			var name;
			
			var success = false;
			try {
				name = spawn[creepInfo.genesis](creepInfo.init);
				success = _.isString(name);
			} catch (error) {
				console.log('error spawning ' + genesis + ':',error)
			}
			
			if (!success) {
				pq.queue(0, creepInfo);
			} else {
				console.log(spawn.name + ' spawning:' +creepInfo.genesis + ' ' + name);
			}
	}

	spawn.memory.pq = pq;
	
//    console.log('after spawn loop:' + JSON.stringify(spawn.memory.pq));
	
};

