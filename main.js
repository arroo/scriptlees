// main.js

require('prototypes');
require('roomPlanner');
// Initialize the game

require('init');
var PriorityQueue = require('pqueue');
var gc = require('garbagecollector');

// Process the creeps
var builder = require('builder');
//var guard = require('guard');
var harvester = require('harvester');
var healer = require('healer');
var population = require('population');
var upgrader = require('upgrader');
var miner = require('miner');
var courier = require('courier');
var repairer = require('repairer');
var tower = require('tower');

var utils = require('utils');
var strerror = utils.strerror;

module.exports.loop = function () {

	//return;
	
	console.log('tick');
	
	// Cleanup dead objects
	gc();
	Memory.constructionSites = Game.constructionSites;

	Object.keys(Game.creeps).forEach(function (name) {
		var creep = Game.creeps[name];
		
		if (creep.spawning || !creep.my) {
			return;
		}
		
		creep.memory.lastPos = creep.pos;
		if (Memory.unsafe) {
			creep.run();
		} else {
			try {
				creep.run();
			} catch (error) {
				console.log(creep.memory.genesis + ' ' + name + ' run error:', error);
			}
		}
	});

	Memory.minionsToMake = Memory.minionsToMake || [];
	Game.spawns.Spawn1.memory.pq = Memory.minionsToMake.reduce(function (pq, genesis) {
		
		var info = {};
		info.priority = 0;
		info.item = {};
		if (typeof Creep.prototype[genesis] === 'function') {}
		
		return pq;
	}, Game.spawns.Spawn1.memory.pq);
	Memory.minionsToMake = [];

	if (Memory.makeTempMinions) {
	
		var tempCreeps = [
			{'priority':4,'item':{'genesis':'makeBuilder', 'init':{}}},
			{'priority':4,'item':{'genesis':'makeBuilder', 'init':{}}}
		];
		Game.spawns.Spawn1.memory.pq = tempCreeps.reduce(function (pq, creepInfo) {
			return pq.queue(creepInfo);
		}, new PriorityQueue(Game.spawns.Spawn1.memory.pq));
		Memory.makeTempMinions = false;
	}
	// process all structures that have something to do
	Object.keys(Game.structures).forEach(id => Game.structures[id].run && Game.structures[id].run());
	// Process the spawns
	
	Object.keys(Game.spawns).forEach(function (name) {
		var spawn = Game.spawns[name];
		spawn.population();
	});

	Object.keys(Game.rooms).forEach(function (name) {
		var room = Game.rooms[name];
		room.memory.warZone = room.findCentroid(room.find(FIND_HOSTILE_CREEPS));
		if (room.memory.warZone) {
			console.log('room ' + name + ' warzone:[' + room.memory.warZone.x + ', ' + room.memory.warZone.y + ']');
		}
		room.moveWarFlag();
	});
	
	if (Memory.testMST) {
		delete Memory.testMST;

		let mstTestFlags = [
			Game.flags.TESTA,
			Game.flags.TESTB,
			Game.flags.TESTC,
			Game.flags.TESTD
		];

		console.log('attempting to find MST of positions:' + mstTestFlags.map(f => '[' + f.pos.x + ',' + f.pos.y + ']').join(','));
		var testMST = {};
		try {
			testMST = utils.findMinSpanningTree(mstTestFlags);
		} catch (error) {
			console.log('testMST failed:', strerror(error));
		}
		console.log('got test mst:' + JSON.stringify(testMST));
	}
	
	Object.keys(Game.rooms).forEach(function (name) {
		Game.rooms[name].plan();
	});
	console.log('tock');
};
