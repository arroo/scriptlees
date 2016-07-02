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

module.exports = function(spawn) {
//return;
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
	return;
	// Ensure each creep role is above its minimum population level in an area around each spawn
	var roles = ['harvester', 'builder', 'guard', 'healer', 'upgrader'];
	for(var i in roles) {
		continue;
		var role = roles[i];
		var creeps = spawn.pos.findInRange(FIND_MY_CREEPS, spawn.memory.populationRange, { filter: function(creep){if(creep.memory && creep.memory.role) return creep.memory.role === role; else return false;} });
		
		if (creeps.length < spawn.memory.minPopulation[role]) {
			// Missing creeps, spawn them
			//console.log('attempting to make a(n) ' + role + ', have ' + creeps.length + ' need ' + spawn.memory.minPopulation[role]);
			var mem = {};
			mem.role = role;
			var ret = spawn.createCreep(spawn.memory.creepSpecs[role], undefined, mem);
			
			if(_.isString(ret)) {
				console.log('new ' + role + ':' + ret);
			} else {
			
				switch (ret) {
					case ERR_BUSY:
					case OK:
					case ERR_NOT_ENOUGH_ENERGY:
						break;
					default:
						console.log('could not spawn ' + role + ':', ret);
						break;
				}
			}
			return;
		}
	}
	
	var madeMiner = spawn.room.find(FIND_FLAGS, { 'filter' : flags.isSourceClosure(RESOURCE_ENERGY)});
};

