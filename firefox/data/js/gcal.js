// Copyright (c) 2014 Clemens Kerschbaumer. All rights reserved.
// Use of this source code is governed by the BSD license that can be
// found in the LICENSE file.

var client = "firefox";

function GoogleCalendar(authParams) {
	var client_id = authParams.client_id;
	var client_secret = authParams.client_secret;
	var auth_credentials = authParams.auth_credentials;
	
	var authenticated = false;
	var authState = "show-auth-screen";
	
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
	
	var authorizeApp = function(callback) {
		path = "https://accounts.google.com/o/oauth2/auth?"+
				"response_type=code&"+
				"client_id=" + encodeURIComponent(client_id) + "&" +
				"scope=" + encodeURIComponent("https://www.googleapis.com/auth/calendar") + "&" +
				"redirect_uri=urn:ietf:wg:oauth:2.0:oob:auto";
		
		self.port.on("success-code", function(code) {
			callback(code);
		});
		self.port.emit("open-tab", {url: path});
	}
	
	this.isAuthenticated = function() {
		return authenticated;
	}
	
	this.getAuthState = function() {
		return authState;
	}
	
	this.refreshToken = function(params, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "https://accounts.google.com/o/oauth2/token", true);
		xhr.setRequestHeader('Host', 'accounts.google.com');
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4) {
				if(xhr.status == 200) {
					authState = "authentication-success";
					auth_credentials = JSON.parse(xhr.response);
					auth_credentials.time_acquired = (new Date()).getTime();
					auth_credentials.expires_in = auth_credentials.expires_in * 1000;
						
					self.port.emit("store-data", {"auth-credentials": auth_credentials});
					
					console.log("REFRESHED CREDENTIALS: " + auth_credentials);
				}else {
					authState = "authentication-failure";
				}
				
				callback();
			}
		}
		
		var data = "client_id=" + encodeURIComponent(authParams.client_id) + "&"+
					"client_secret=" + encodeURIComponent(authParams.client_secret) + "&"+
					"refresh_token=" + encodeURIComponent(auth_credentials.refresh_token) + "&" +
					"grant_type=refresh_token&";
		
		xhr.send(data);
	}
	
	this.getAuthToken = function(params, callback) {
		//console.log("fallback: \n" + authParams.client_id + "\n" + authParams.client_secret + "\n\n");
		
		if(auth_credentials.access_token) {
			if((new Date()).getTime() - auth_credentials.time_acquired > auth_credentials.expires_in) {
				this.refreshToken(params, function() {
					callback(auth_credentials.access_token);
				});
			}else {
				authState = "authentication-success";
				callback(auth_credentials.access_token);
			}
		}else {
			authorizeApp(function(auth_code) {
				if(auth_code == undefined) {
					authState = "authentication-failure";
					callback(undefined);
					return;
				}
			
				//console.log("AUTH CODE: " + auth_code + "\n\n\n\n");
				var xhr = new XMLHttpRequest();
				xhr.open("POST", "https://accounts.google.com/o/oauth2/token", true);
				xhr.setRequestHeader('Host', 'accounts.google.com');
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		
				xhr.onreadystatechange = function() {
					//console.log("state changed" );
					if(xhr.readyState == 4) {
						//console.log("response: " + xhr.responseText );
						if(xhr.status == 200) {
							authState = "authentication-success";
							auth_credentials = JSON.parse(xhr.response);
							auth_credentials.time_acquired = (new Date()).getTime();
							auth_credentials.expires_in = auth_credentials.expires_in * 1000;
							
							self.port.emit("store-data", {"auth-credentials": auth_credentials});
						
							//console.log(auth_credentials);
						}else {
							authState = "authentication-failure";
						}
						callback();
					}
				};
		
				var data = "code=" + encodeURIComponent(auth_code) + "&"+
						"client_id=" + encodeURIComponent(authParams.client_id) + "&"+
						"client_secret=" + encodeURIComponent(authParams.client_secret) + "&"+
						"grant_type=authorization_code&" +
						"redirect_uri=" + encodeURIComponent("urn:ietf:wg:oauth:2.0:oob:auto");
		
				xhr.send(data);
			});
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
		
		var getAuthToken = undefined;
		
		if(client == "chrome") {
			getAuthToken = chrome.identity.getAuthToken;
		}else {
			getAuthToken = this.getAuthToken;
		}

		getAuthToken({ 'interactive': true }, function(access_token) {	
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
					if(xhr.status == 200) {
						args.callback(JSON.parse(xhr.response), xhr.response);
					}else {
						args.callback(null, xhr.response);
					}
				}
			};
			xhr.send(JSON.stringify(args.body));
		});
	}
}

