// Copyright (c) 2014 Clemens Kerschbaumer. All rights reserved.
// Use of this source code is governed by the BSD license that can be
// found in the LICENSE file.

function GoogleCalendar() {
	
	this.listColors = function(callback) {
		this.request({'path': '/calendar/v3/colors',
					  'method': 'GET',
					  'callback': callback}); //function(response)
	}
	
	this.listCalendars = function(callback) {
		this.request({'path': '/calendar/v3/users/me/calendarList',
					  'method': 'GET',
					  'callback': callback}); //function(response)
	}
	
	this.insertEvent = function(calId, event, callback) {
		this.request({'path': '/calendar/v3/calendars/'+calId+'/events',
					 'method': 'POST',
					 'body': event,
					 'callback': callback});
	}
	
	this.exportEvents = function(calId, clist, callback) {
		for(var key in clist) {
			for(var i = 0; i < clist[key].length; i++) {
				if(clist[key][i]["exclude"])
					continue;
			
				
				for(var k = 0; k < clist[key][i]["date_time_place"].length; k++) {
					var ek = clist[key][i]["date_time_place"][k];
				
					var now = new Date();
					var event = {
							//"kind": "calendar#event",
							"end": { "timeZone": "Europe/Vienna" },
							"start": { "timeZone": "Europe/Vienna" },
							"description": clist[key][i]["lecturers"].join(", ") + " - " + clist[key][i]["credits"],
							"location": ek["LOCATION"],
							"sequence": 0,
							"summary": clist[key][i]["type"] + ": " + clist[key][i]["title"] + (ek["ATTR"] ? " - "+ ek["ATTR"]: "")
						};
					
					if("FIRST_DATE" in ek && "FROM" in ek && "UNTIL" in ek) {
						event.start["dateTime"] = toDateObj(ek["FIRST_DATE"], ek["FROM"]).toISOString();
						event.end["dateTime"] = toDateObj(ek["FIRST_DATE"], ek["UNTIL"]).toISOString();
					}else if("DATE" in ek && "FROM" in ek && "UNTIL" in ek) {
						event.start["dateTime"] = toDateObj(ek["DATE"], ek["FROM"]).toISOString();
						event.end["dateTime"] = toDateObj(ek["DATE"], ek["UNTIL"]).toISOString();
					}else
						throw new Error('Incomplete Event. Cannot process.');
						
					if(ek["FREQ"]) {
						var dt = toDateObj(ek["LAST_DATE"], ek["UNTIL"]);
						
						var rrule = "RRULE:" + (new ICalendar()).repeatRule(ek["FREQ"])
											 + (dt ? ";UNTIL=" + (new ICalendar()).toDate(toDateObj(ek["LAST_DATE"], ek["UNTIL"])) : "");
											 + ";BYDAY=" +  ek["DAYS"].join(",");
						
						event["recurrence"] = [rrule];
					}
					this.insertEvent(calId, event, callback);
				}
			}
		}
	}

	this.request = function(args) {
		if(typeof args !== 'object')
			throw new Error('args required');
		if(typeof args.callback !== 'function')
			throw new Error('callback required');
		if(typeof args.method !== 'string')
			throw new Error('method required');
		if(typeof args.path !== 'string')
			throw new Error('path required');

		chrome.identity.getAuthToken({ 'interactive': true }, function(access_token) {	
			var path = 'https://www.googleapis.com' + args.path;
		
			if(typeof args.params === 'object') {
				var deliminator = '?';
				for(var i in args.params) {
					path += deliminator + encodeURIComponent(i) + "="
										+ encodeURIComponent(args.params[i]);
					deliminator = '&';
				}
			}
			var xhr = new XMLHttpRequest();
			xhr.open(args.method, path, true);
			xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
			xhr.setRequestHeader('Content-type', 'application/json');
			
			xhr.onreadystatechange = function() {
				if(xhr.readyState == 4) {
					if(xhr.status == 200)
						args.callback(JSON.parse(xhr.response), xhr.response);
					else
						args.callback(null, xhr.response);
				}
			};
			xhr.send(JSON.stringify(args.body));
		});
	}
}

