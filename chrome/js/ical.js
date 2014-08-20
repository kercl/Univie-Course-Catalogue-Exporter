// Copyright (c) 2014 Clemens Kerschbaumer. All rights reserved.
// Use of this source code is governed by the BSD license that can be
// found in the LICENSE file.

function ICalendar() {
	this.icalHeader = "BEGIN:VCALENDAR\n"+
	                  "VERSION:2.0\n"+
	                  "PRODID:Chrome Univie Course Catalogue Exporter 0.1\n"+
	                  "CALSCALE:GREGORIAN\n";
	
	this.icalFooter = "END:VCALENDAR\n";
	
	this.repeatRule = function(r) {
		if(r == "WEEKLY")
			return "FREQ=WEEKLY";
		else if(r == "EVERY_OTHER_WEEK")
			return "FREQ=WEEKLY;INTERVAL=2"
		return "NONE";
	}

	this.toDate = function(dt) {
		txtw = prependZeros(dt.getFullYear().toString(), 4)+
			   prependZeros((dt.getMonth()+1).toString(), 2)+
			   prependZeros(dt.getDate().toString(), 2)+'T'+
			   prependZeros(dt.getHours().toString(), 2)+
			   prependZeros(dt.getMinutes().toString(), 2)+"00Z";
		return txtw;
	}

	this.exportEvents = function(clist) {
		var text = this.icalHeader;
		
		for(var key in clist) {
			for(var i = 0; i < clist[key].length; i++) {
				if(clist[key][i]["exclude"])
					continue;
			
				for(var k = 0; k < clist[key][i]["date_time_place"].length; k++) {
					var ek = clist[key][i]["date_time_place"][k];
				
					text = text + "BEGIN:VEVENT\n";
					if("FIRST_DATE" in ek) {
						var dt = toDateObj(ek["FIRST_DATE"], ek["FROM"]);
						text = text + (dt ? "DTSTART:" + this.toDate(dt) + "\n" : "");
						var dt = toDateObj(ek["FIRST_DATE"], ek["UNTIL"]);
						text = text + (dt ? "DTEND:" + this.toDate(dt) + "\n" : "");
					}else {
						text = text + "DTSTART:" + this.toDate(toDateObj(ek["DATE"], ek["FROM"])) + "\n";
						text = text + "DTEND:" +   this.toDate(toDateObj(ek["DATE"], ek["UNTIL"])) + "\n";
					}
					if(ek["FREQ"]) {
						text = text + "RRULE:" +   this.repeatRule(ek["FREQ"]);
						var dt = toDateObj(ek["LAST_DATE"], ek["UNTIL"]);
						text = text +  (dt ? ";UNTIL=" + this.toDate(dt) : "");
						text = text + ";BYDAY=" +  ek["DAYS"].join(",") + "\n";
					}
					text = text + "DTSTAMP:" + this.toDate(new Date()) + "\n";
					text = text + "CREATED:" + this.toDate(new Date()) + "\n";
					text = text + "DESCRIPTION: " + (clist[key][i]["lecturers"].join(", ") + " - " + clist[key][i]["credits"]).replace(/\,/g, "\\,") + "\n";
					text = text + "LOCATION: " + ek["LOCATION"] + "\n";
					text = text + "SEQUENCE:0\n";
					text = text + "SUMMARY:" + clist[key][i]["type"] + ": " + clist[key][i]["title"] + (ek["ATTR"] ? " - "+ ek["ATTR"]: "") + "\n";
					text = text + "END:VEVENT\n";
				}
			}
		}
	
		text = text + this.icalFooter;
	
		return text;
	}
}

