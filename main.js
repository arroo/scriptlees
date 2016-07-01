// main.js

require('prototypes');
require('roomPlanner');
// Initialize the game

require('init');
var PriorityQueue = require('pqueue');


// Process the creeps
var builder = require('builder');
//var guard = require('guard');
var harvester = require('harvester');
var healer = require('healer');
var population = require('population');
var upgrader = require('upgrader');
var miner = require('miner');
var courier = require('courier')
var repairer = require('repairer')

module.exports.loop = function () {

    // Cleanup dead objects
    require('garbagecollector');
    Memory.constructionSites = Game.constructionSites;
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.memory.lastPos = creep.pos;
            try {
                creep.run();
            } catch (error) {
                console.log(creep.memory.genesis + ' ' + name + ' error:', error);
           }
    }

    
    Game.spawns.Spawn1.memory.pq = Memory.minionsToMake.reduce(function (pq, genesis) {
        
        var info = {};
        info.priority = 0;
        info.item = {};
        if (typeof Creep.prototype[genesis] === 'function') {}
        
        return pq;
    }, Game.spawns.Spawn1.memory.pq);
    Memory.minionsToMake = [];

    if (!Memory.makeTempMinions) {
    
        var tempCreeps = [
            {'priority':4,'item':{'genesis':'makeBuilder', 'init':{}}},
            {'priority':4,'item':{'genesis':'makeBuilder', 'init':{}}}
        ];
        Game.spawns.Spawn1.memory.pq = tempCreeps.reduce(function (pq, creepInfo) {
            return pq.queue(creepInfo);
        }, new PriorityQueue(Game.spawns.Spawn1.memory.pq));
        Memory.makeTempMinions = true;
}

    // Process the spawns
    
    for(var name in Game.spawns) {
        population(Game.spawns[name]);
    }

    Object.keys(Game.rooms).forEach(function (name) {
        Game.rooms[name].plan();
    });
}
