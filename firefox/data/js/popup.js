// Copyright (c) 2014 Clemens Kerschbaumer. All rights reserved.
// Use of this source code is governed by the BSD license that can be
// found in the LICENSE file.

var gcalInterface = new GoogleCalendar({});

var chrome; // compatibility object

function toggleInfoBox(text) {
	var ib = document.getElementById("info-box");
	var ibt = document.getElementById("info-box-text");
	
	if(text) {
		ib.style.display = "block";
		ibt.textContent = text;
	}else {
		ib.style.display = "none";
	}
}

function exportToICalendar() {
	toggleInfoBox("Generating iCalendar...");
	
	calexp = new ICalendar();
	
	text = calexp.exportEvents(chrome.extension.getBackgroundPage().selectedCourses);

	//console.log("Generating iCalendar:\n" + text);
	
	var pom = document.createElement('a');
	pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	pom.setAttribute('download', 'schedule.ics');
	document.body.appendChild(pom);
	pom.click();
    
    toggleInfoBox(null);
}

function exportToGoogleCalendar() {
	toggleInfoBox("Exporting to Google calendar...");
	
	var calSel = document.getElementById("calendar-select");
	if(calSel.value == "") {
		alert("Please select a calendar from the list.");
	}else {
		gcalInterface.exportEvents(calSel.value, chrome.extension.getBackgroundPage().selectedCourses, function(jsr, txtr){
			});
	}
	
	toggleInfoBox(null);
}

function valueToHumanReadable(schedule, val) {
	switch(val) {
		case "DAYS": 
			if("DAYS" in schedule) {
				daytable = {MO:"Mo",TU:"Tu",WE:"We",TH:"Th",FR:"Fr",SA:"Sa",SU:"Su"};
				daytable.convert = function(xx){var ret=[];for(var k=0;k<xx.length;k++)ret[k]=daytable[xx[k]];return ret;};
				
				if(schedule["DAYS"].length == 1)
					return daytable.convert(schedule["DAYS"])[0];
				else
					return daytable.convert(schedule["DAYS"]).join(", ");
				return "";
			}
			break;
		case "FREQ":
			if(schedule["FREQ"] == "WEEKLY") return "weekly";
			if(schedule["FREQ"] == "EVERY_OTHER_WEEK") return "every other week";
			return "";
			break;
		case "ATTR":
			if(schedule["ATTR"] == "Vorbesprechung") return "Briefing";
	}
	return "";
}

function scheduleToHumanReadable(schedule) {
	var rtext = "";
	
	template = document.getElementById("schedule-template").innerHTML;
	for(var i = 0; i < schedule.length; i++) {
		current = template;
		
		var hDays = valueToHumanReadable(schedule[i], "DAYS");
		var hFreq = valueToHumanReadable(schedule[i], "FREQ");
		if(hDays != "" || hFreq != "") {
			current = current.replace("{{days}}", hDays);
			current = current.replace("{{freq}}", hFreq);
		}else {
			current = current.replace("__none_td_days__", "inactive-bgcol");
			current = current.replace("{{days}}", "");
			current = current.replace("{{freq}}", "");
		}
		current = current.replace("{{first}}", schedule[i]["FIRST_DATE"]?schedule[i]["FIRST_DATE"]:schedule[i]["DATE"]);
		if(schedule[i]["LAST_DATE"]) {
			current = current.replace("{{last}}", schedule[i]["LAST_DATE"]);
		}else {
			current = current.replace("{{last}}", "");
			current = current.replace("__none_td_last__", "inactive-bgcol");
		}
		current = current.replace("{{from}}", schedule[i]["FROM"]);
		current = current.replace("{{until}}", schedule[i]["UNTIL"]);
		if(schedule[i]["ATTR"])
			current = current.replace("{{note}}", "<i>" + valueToHumanReadable(schedule[i], "ATTR") + "</i><br /><br />");
		else
			current = current.replace("{{note}}", "");
		current = current.replace("{{place}}", schedule[i]["LOCATION"]);
		
		rtext = rtext + current + "<br />";
	}
	
	return rtext;
}

function generateList() {
	var bg = chrome.extension.getBackgroundPage();	
	
	color = 1;
	for(var key in bg.selectedCourses) {
		for(var i = 0; i < bg.selectedCourses[key].length; i++) {
			entryId = bg.selectedCourses[key][i]["id"] + "-" + i;
			
			template = document.getElementById("selection-entry-template").innerHTML;
			
			entry = document.createElement("div");
			
			if(i == bg.selectedCourses[key].length - 1) {
				entry.className = "selection-entry color" + color;
			}else {
				entry.className = "selection-sub-entry color" + color;
			}
			if(i == 0) {
				template = template.replace("{{title-row}}", "");
			}else {
				template = template.replace("{{title-row}}", "template");
			}
			
			template = template.replace("{{title}}", bg.selectedCourses[key][i]["title"]);
			template = template.replace("{{type}}", bg.selectedCourses[key][i]["type"]);
			template = template.replace("{{lecturers}}", bg.selectedCourses[key][i]["lecturers"].join("<br />"));
			template = template.replace("{{schedule}}", scheduleToHumanReadable(bg.selectedCourses[key][i]["date_time_place"]));
			template = template.replace("{{id}}", bg.selectedCourses[key][i]["id"]);
			template = template.replace("{{subid}}", i);
			
			entry.innerHTML = template;
			document.getElementById("selection-area").appendChild(entry);
			
			checkbox = document.getElementById("include-"+entryId);
			
			if(bg.selectedCourses[key][i]["exclude"])
				checkbox.checked = false;
			else
				checkbox.checked = true;
			
			checkbox.onclick = function(curcb, id, subid) {
				return function() {
					if(curcb.checked) {
						bg.selectedCourses[id][subid]["exclude"] = undefined;
					}else {
						bg.selectedCourses[id][subid]["exclude"] = true;
					}
				};}(checkbox, bg.selectedCourses[key][i]["id"], i);
		}
		color = (color % 2) + 1;
	}
}

function fetchMyCalendars() {
	gcalInterface.listCalendars(function(response) {
			if(response.items == undefined)
				return;
			for(var i = 0; i < response.items.length; i++) {
				option = document.createElement("option");
				option.value = response.items[i].id;
				option.textContent = response.items[i].summary;
				
				document.getElementById("calendar-select").appendChild(option);
			}
		});
}

function initPopup() {
	generateList();
	
	if(gcalInterface.getAuthState() == "authentication-success") {
		fetchMyCalendars();
		document.getElementById("export-gcal").onclick = exportToGoogleCalendar;
	}else {
		document.getElementById("export-gcal").disabled = true;
	}
	
	document.getElementById("export-ical").onclick = exportToICalendar;
	document.getElementById("clear").onclick = 
		function() { 
			//chrome.extension.getBackgroundPage().selectedCourses = {};
			document.getElementById("selection-area").innerHTML = "";
			self.port.emit("clear-courses");
		};
	document.getElementById("sign-out").onclick = 
		function() { 
			document.getElementById("calendar-select").innerHTML = '<option value="" disabled="disabled" selected="selected">Select a calendar...</option>';
			self.port.emit("store-data", {"auth-credentials": {}});
			document.getElementById("export-gcal").disabled = true;
		};
}
/*
window.onload = function() {*/
	self.port.on("init-params", function(msg) {
		chrome = {
			extension: {
				getBackgroundPage: function(){ 
					return {selectedCourses: msg.courses};
				}
			}
		};
		
		gcalInterface = new GoogleCalendar({
			client_id:     msg.client_id, 
			client_secret: msg.client_secret,
			auth_credentials: msg.auth_credentials
		});
		
		if(gcalInterface.getAuthState() != "show-auth-screen") {
			self.port.emit("show-panel");
			initPopup();
		}else {
			gcalInterface.getAuthToken({ 'interactive': true }, function() {
				if(gcalInterface.getAuthState() != "show-auth-screen") {
					self.port.emit("show-panel");
					initPopup();
				}
			});
		}
	});
//};

