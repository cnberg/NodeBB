"use strict";

var async = require('async');


module.exports = function(db, module) {
	var helpers = module.helpers.level;
	
	module.sortedSetAdd = function(key, score, value, callback) {
		module.getListRange(key, 0, -1, function(err, set) {
			set = set.filter(function(a) {return a.value !== value.toString();});

			set.push({
				value: value.toString(),
				score: parseInt(score, 10)
			});

			set.sort(function(a, b) {return a.score - b.score;});
			module.set(key, set, callback);
		});
	};

	module.sortedSetRemove = function(key, value, callback) {
		module.getListRange(key, 0, -1, function(err, set) {
			set = set.filter(function(a) {return a.value !== value.toString();});
			module.set(key, set, callback);
		});
	};

	function flattenSortedSet(set, callback) {
		callback(null, !set.length ? [] : set.reduce(function(a, b) {
			return (a.length ? a : [a.value]).concat([b.value]);
		}));
	}

	module.getSortedSetRange = function(key, start, stop, callback) {
		module.getListRange(key, start, stop, function(err, set) {
			set = !set.length ? [] : set.reduce(function(a, b) {
				return (a.length ? a : [a.value]).concat(b.value);
			});
			if (set.value) {
				set = [set.value];
			}
			callback(err, set);
		});
	};

	module.getSortedSetRevRange = function(key, start, stop, callback) {
		module.getListRange(key, start, stop, function(err, set) {
			set = !set.length ? [] : set.reverse().reduce(function(a, b) {
				return (a.length ? a : [a.value]).concat(b.value);
			});
			if (set.value) {
				set = [set.value];
			}
			callback(err, set);
		});
	};

	module.getSortedSetRangeByScore = function(key, start, count, min, max, callback) {
		module.getListRange(key, 0, -1, function(err, list) {
			if (min && max) {
				list.filter(function(a) {
					return a.score >= min && a.score <= max; // to check: greater or and equal?
				});
			}

			flattenSortedSet(list.slice(start ? start : 0, count ? count : list.length), callback);
		});
	};

	module.getSortedSetRevRangeByScore = function(key, start, count, max, min, callback) {
		module.getListRange(key, 0, -1, function(err, list) {
			if (min && max) {
				list.filter(function(a) {
					return a.score >= min && a.score <= max; // to check: greater or and equal?
				});
			}

			flattenSortedSet(list.slice(start ? start : 0, count ? count : list.length).reverse(), callback);
		});
	};

	module.sortedSetCount = function(key, min, max, callback) {
		module.getListRange(key, 0, -1, function(err, list) {
			list.filter(function(a) {
				return a.score >= min && a.score <= max; // to check: greater or and equal?
			});

			callback(err, list.length);
		});
	};

	module.sortedSetCard = function(key, callback) {
		module.getListRange(key, 0, -1, function(err, list) {
			callback(err, list.length);
		});
	};

	module.sortedSetRank = function(key, value, callback) {
		module.getListRange(key, 0, -1, function(err, list) {
			for (var i = 0, ii=list.length; i< ii; i++) {
				if (list[i].value === value) {
					return callback(err, i);
				}
			}

			callback(err, null);
		});
	};

	module.sortedSetRevRank = function(key, value, callback) {
		module.getListRange(key, 0, -1, function(err, list) {
			for (var i = list.length - 1, ii=0; i > ii; i--) {
				if (list[i].value === value.toString()) {
					return callback(err, i);
				}
			}

			callback(err, null);
		});
	};

	module.sortedSetScore = function(key, value, callback) {
		module.getListRange(key, 0, -1, function(err, list) {
			for (var i = 0, ii=list.length; i< ii; i++) {
				if (list[i].value === value.toString()) {
					return callback(err, list[i].score);
				}
			}

			callback(err, null);
		});
	};

	module.isSortedSetMember = function(key, value, callback) {
		// maybe can be improved by having a parallel array
		module.getListRange(key, 0, -1, function(err, list) {
			for (var i = 0, ii=list.length; i< ii; i++) {
				if (list[i].value === value.toString()) {
					return callback(err, true);
				}
			}

			callback(err, false);
		});
	};

	module.sortedSetsScore = function(keys, value, callback) {
		var sets = {};
		async.each(keys, function(key, next) {
			module.sortedSetScore(key, value, function(err, score) {
				sets[key] = value;
				next();
			});
		}, function(err) {
			callback(err, sets);
		});
	};
};