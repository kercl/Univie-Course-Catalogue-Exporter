// Copyright (c) 2014 Clemens Kerschbaumer. All rights reserved.
// Use of this source code is governed by the BSD license that can be
// found in the LICENSE file.

function prependZeros(s, n) {
	return ("0".repeat(n)+s).substr(s.length,n);
}

function getLocation(href) {
	var l = document.createElement("a");
	l.href = href;
	return l;
}

function toDateObj(date, time) {
	if(!date || !time)
		return undefined;
	d = date.split(".");
	t = time.split(":");
	return new Date(d[2], d[1]-1, d[0], t[0], t[1], 0, 0);
}

function clone(obj) {
	if (null == obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
}

//////////////////////////////////////////
// String functions
//////////////////////////////////////////

String.prototype.repeat = function(num) {
    return new Array(num + 1).join(this);
}

String.prototype.cut = function(arr) {
	var result = new Array();
	result.push(this);
	for(var i = 0; i < arr.length; i++) {
		var tmp = [];
		for(var j = 0; j < result.length; j++) {
			s = result[j].split(arr[i]);
			for(var k = 0; k < s.length; k++) {
				tmp.push(s[k]);
				if(k < s.length - 1)
					tmp.push(arr[i]);
			}
		}
		result = tmp;
	}
	return result;
}

String.prototype.count = function count(str) {
	return this.split(str).length - 1;
}

