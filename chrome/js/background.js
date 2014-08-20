// Copyright (c) 2014 Clemens Kerschbaumer. All rights reserved.
// Use of this source code is governed by the BSD license that can be
// found in the LICENSE file.


var selectedCourses = {};

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function updateSelected(tabId) {
	selectedId = tabId;
}

function updateCourses(tabId) {
	chrome.tabs.sendRequest(tabId, {}, function(res) {
		if(res) {
			chrome.pageAction.show(tabId);
		}else {
			chrome.pageAction.hide(tabId);
		}
	});
}

chrome.runtime.onMessage.addListener(function(msg, sender, response) {
	var courses = msg["courses"];

	if(msg["instruction"] == "enable")
		if(courses[0])
			selectedCourses[courses[0]["id"]] = courses;
	else
		if(courses[0])
		selectedCourses[courses[0]["id"]] = undefined;
});

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
	if (change.status == "complete") {
		updateSelected(tabId);
		updateCourses(tabId);
	}
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {
	updateSelected(tabId);
});

// Ensure the current selected tab is set up.
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	updateCourses(tabs[0].id);
});

