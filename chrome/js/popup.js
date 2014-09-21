// Copyright (c) 2014 Clemens Kerschbaumer. All rights reserved.
// Use of this source code is governed by the BSD license that can be
// found in the LICENSE file.

var gcalExp = new GoogleCalendar();
var selectedMethod = "ical";
var calendarsFetched = false;


function exportToICalendar() {
	calexp = new ICalendar();
	
	text = calexp.exportEvents(chrome.extension.getBackgroundPage().selectedCourses);

	var pom = document.createElement('a');
	pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', 'schedule.ics');
    pom.click();
}


function exportToGoogleCalendar() {
	var calSel = document.getElementsByName("calendar-select");
	var calSelValue = "";
	
	for(var i = 0; i < calSel.length; i++) {
		if(calSel[i].checked) {
			calSelValue = calSel[i].value;
		}
	}
	
	if(calSelValue == "") {
		alert("Please select a calendar.");
	}else {
		gcalExp.exportEvents(calSelValue, chrome.extension.getBackgroundPage().selectedCourses, function(jsr, txtr){});
		alert("Events successfully exported.");
	}
}

function prettyPrint(schedule, val) {
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

function scheduleTable(schedule) {
	var rtext = "";
	var div = document.createElement("div");
	
	for(var i = 0; i < schedule.length; i++) {
		var current = document.createElement("table");
		current.className = "schedule-table";
		
		var tr = document.createElement("tr");
		var td_freq = document.createElement("td"),
		    td_first = document.createElement("td"),
		    td_from = document.createElement("td");
		td_freq.rowSpan = "2";
		td_freq.width = "150";
		tr.appendChild(td_freq);
		tr.appendChild(td_first);
		tr.appendChild(td_from);
		current.appendChild(tr);
		
		tr = document.createElement("tr");
		var td_last = document.createElement("td"),
		    td_until = document.createElement("td");
		tr.appendChild(td_last);
		tr.appendChild(td_until);
		current.appendChild(tr);
		
		tr = document.createElement("tr");
		var td_note_place = document.createElement("td");
		td_note_place.colSpan = "3";
		tr.appendChild(td_note_place);
		current.appendChild(tr);
		
		var hDays = prettyPrint(schedule[i], "DAYS");
		var hFreq = prettyPrint(schedule[i], "FREQ");
		if(hDays != "" || hFreq != "") {
			td_freq.appendChild(document.createTextNode(hDays));
			td_freq.appendChild(document.createElement("br"));
			td_freq.appendChild(document.createTextNode(hFreq));
			td_freq.className = "centering";
		}else {
			td_freq.className = "centering inactive-bgcol";
		}
		td_first.appendChild(document.createTextNode(schedule[i]["FIRST_DATE"]?schedule[i]["FIRST_DATE"]:schedule[i]["DATE"]));
		if(schedule[i]["LAST_DATE"]) {
			td_last.appendChild(document.createTextNode(schedule[i]["LAST_DATE"]));
		}else {
			td_last.className = "inactive-bgcol";
		}
		td_from.appendChild(document.createTextNode(schedule[i]["FROM"]));
		td_until.appendChild(document.createTextNode(schedule[i]["UNTIL"]));
		
		if(schedule[i]["ATTR"]) {
			var italic = document.createElement("i");
			italic.appendChild(document.createTextNode(prettyPrint(schedule[i], "ATTR")));
			italic.appendChild(document.createElement("br"));
			italic.appendChild(document.createElement("br"));
			td_note_place.appendChild(italic);
		}
		td_note_place.appendChild(document.createTextNode(schedule[i]["LOCATION"]));
		
		div.appendChild(current);
	}
	
	return div;
}

function generateList() {
	var bg = chrome.extension.getBackgroundPage();
	
	color = 1;
	var entry = document.createElement("div");
	
	var n = 0;
	for(var key in bg.selectedCourses) {
		for(var i = 0; i < bg.selectedCourses[key].length; i++) {
			entryId = bg.selectedCourses[key][i]["id"] + "-" + i;

			var div = document.createElement("div");
			div.className = "inner-entry";
			var table = document.createElement("table");
			table.className = "entry-table";
			
			if((n % 2) == 0) {
				div.style.borderLeft = "5px solid #006699";
			}else {
				div.style.borderLeft = "5px solid white";
			}
			
			if(i == 0) {
				var tr = document.createElement("tr"); // row 1
				var td = document.createElement("td");
				tr.appendChild(td);
			
				td = document.createElement("td");
				td.colSpan = "2";
				td.style.fontWeight = "bold";
				td.style.fontSize = "large";
				td.textContent = bg.selectedCourses[key][i]["type"] + ": " + bg.selectedCourses[key][i]["title"];
				tr.appendChild(td);
				table.appendChild(tr);
			}
			
			tr = document.createElement("tr"); // row 2
			td = document.createElement("td");
			td.style.fontWeight = "bold";
			td.width = "80";
			td.textContent = "Lecturers:";
			tr.appendChild(td);
			
			td = document.createElement("td");
			td.className = "box";
			td.textContent = bg.selectedCourses[key][i]["lecturers"].join(", ");
			tr.appendChild(td);
			
			td = document.createElement("td");
			td.className = "box";
			td.width = "150";
			td.align = "right";
			var label = document.createElement("label");
			var checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.id = "include-" + bg.selectedCourses[key][i]["id"] + "-" + i;
			label.appendChild(checkbox);
			label.appendChild(document.createTextNode("Include this course"));
			td.appendChild(label);
			tr.appendChild(td);
			table.appendChild(tr);
			
			tr = document.createElement("tr"); // row 3
			td = document.createElement("td");
			td.style.fontWeight = "bold";
			td.className = "box";
			td.textContent = "Schedule:";
			td.width = "80";
			tr.appendChild(td);
			
			td = document.createElement("td");
			td.className = "box";
			td.colSpan = "3";
			td.appendChild(scheduleTable(bg.selectedCourses[key][i]["date_time_place"]));
			tr.appendChild(td);
			table.appendChild(tr);
			
			div.appendChild(table);
			entry.appendChild(div);
			
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
		n++;
	}
	document.getElementById("selection-area").appendChild(entry);
}

function fetchMyCalendars() {
	gcalExp.listColors(function(colors) {
			gcalExp.listCalendars(function(response) {
					if(response.items == undefined)
						return;
					
					for(var i = 0; i < response.items.length; i++) {
						var tr = document.createElement("tr");
						var td = document.createElement("td");
						var div = document.createElement("div");
						div.style.backgroundColor = colors.calendar[response.items[i].colorId].background;
						div.style.borderRadius = "5px";
						div.style.width = "15px";
						div.style.height = "15px";
						td.appendChild(div);
						tr.appendChild(td);
						td = document.createElement("td");
						td.textContent = response.items[i].summary;
						tr.appendChild(td)
						td = document.createElement("td");
						var radio = document.createElement("input");
						radio["name"] = "calendar-select";
						radio["type"] = "radio";
						radio["value"] = response.items[i].id;
						td.appendChild(radio);
						tr.appendChild(td);
						
						document.getElementById("calendar-list").appendChild(tr);
					}
					
					calendarsFetched = true;
				});
			});
}

function initPopup() {
	generateList();
	
	link("method-ical", "onclick", function(elem) {
		selectedMethod = "ical";
		document.getElementById("calendar-list").style.display = "none";
	});
	
	link("method-gcal", "onclick", function(elem) {
		selectedMethod = "gcal";
		if(calendarsFetched == false)
			fetchMyCalendars();
		document.getElementById("calendar-list").style.display = "inline";
	});
	
	document.getElementById("export").onclick = 
		function() {
			if(selectedMethod == "ical") {
				exportToICalendar();
			}else if(selectedMethod == "gcal") {
				exportToGoogleCalendar();
			}
		};
	
	document.getElementById("clear").onclick = 
		function() { 
			chrome.extension.getBackgroundPage().selectedCourses = {};
			document.getElementById("selection-area").innerHTML = "";
		};
}

window.onload = initPopup;

