/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('pqueue');
 * mod.thing == 'a thing'; // true
 */

function PriorityQueue(init) {
	init = init || {};
	this.q = init.q || {};
	this.p = _.isArray(init.p) ? init.p : [];
	if (init.sorter) {
		this.sorter = init.sorter;
	}
	return this;
}

PriorityQueue.prototype.queue = function (priority, item) {
	if (_.isNumber(priority)) {
		
	} else if (_.isObject(priority) && _.isNumber(priority.priority) && typeof priority.item !== 'undefined') {
		item = priority.item;
		priority = priority.priority;
	} else {
		return this;
	}
	
	if (!this.q[priority]) {
		this.q[priority] = [];
		
		this.p.push(priority);
		if (this.sorter) {
			this.p.sort(this.sorter);
		} else {
			this.p.sort();
		}
	}

	this.q[priority].push(item);
	
	return this;
};

PriorityQueue.prototype.dequeue = function () {
	if (!this.p.length) {
		return;
	}
	
	var highestPriority = this.p[0];
	
 //   console.log('before dequeue'+JSON.stringify(this.q[highestPriority]));
	var highestPriorityItem = this.q[highestPriority].shift();
//    console.log('after dequeue:'+JSON.stringify(this.q[highestPriority]));
//    console.log(!this.q[highestPriority].length);
	
	if (!this.q[highestPriority].length) {
//        console.log('last item of priority ' + highestPriority);
		delete this.q[highestPriority];
		this.p.shift();
	}
	
	return highestPriorityItem;
};

module.exports = PriorityQueue;