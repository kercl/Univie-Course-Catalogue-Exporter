// Copyright (c) 2014 Clemens Kerschbaumer. All rights reserved.
// Use of this source code is governed the BSD license that can be
// found in the LICENSE file.

var checkBoxesSet = false;

if (window == top) {
	chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
		sendResponse(parseCourses());
	});
}

var eventPattern = {
	"compiled": false,
	
	"targets": ["<<DAY>>",
				"<<DAY_SET>>",
				"<<FREQ>>",
				"<<DATE_SET>>",
				"<<FIRST_DATE>>",
				"<<LAST_DATE>>",
				"<<DATE>>",
				"<<TIME>>",
				"<<ACADEM_Q>>",
				"<<FROM>>",
				"<<UNTIL>>",
				"<<LOCATION>>",
				"<<ATTR>>",
				"<<ATTR2>>",
				"<<ATTR3>>"],

	"abbr": {"{{set-sep}}":  "(, ?| und | ?\\/? )",
			 "{{day#}}":     "(MO|DI|MI|DO|FR|SA|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag)",
			 "{{day}}":      "<<DAY>>{{day#}}",
			 "{{day-set}}":  "<<DAY_SET>>(({{day#}}{{set-sep}}?)+)",
			 "{{freq}}":     "<<FREQ>>(wtl|14-tg|14-tägig)",
			 "{{date#}}":    "((\\d+\\.){2}\\d+)",
			 "{{date}}":     "<<DATE>>{{date#}}",
			 "{{date-int}}": "((von )?<<FIRST_DATE>>{{date#}}( bis | ?- ?)<<LAST_DATE>>{{date#}})", //"((von <<FIRST_DATE>>{{date#}} bis <<LAST_DATE>>{{date#}})|<<FIRST_DATE>>{{date#}}-<<LAST_DATE>>{{date#}})",
			 "{{date-set}}": "<<DATE_SET>>(({{date#}}(, ?| und | ?\\/? )?)+)",
			 "{{time#}}":    "(\\d+[\.:]\\d+)",
			 "{{time}}":     "<<TIME>>{{time#}}",
			 "{{academ-q}}": "<<ACADEM_Q>>([cs]\\.t\\.)",
			 "{{time-int}}": "(<<FROM>>{{time#}}[^\\S\\n]?-[^\\S\\n]?<<UNTIL>>{{time#}})",
			 "{{text}}":     "([\\w üöäÜÖÄß\\!\\.,-:\\(\\)]+)", // do not include < and >!!!
			 "{{loc}}":      "<<LOCATION>>{{text}}"},
	
	"patternStrings": ["^<<ATTR3>>(Beginn)?( und )?<<ATTR>>(Vorbesprechung)?:? ?{{day}}? ?{{freq}}? ?({{date-int}}|{{date}})( von| um)? ({{time-int}}|{{time}})( Uhr)?,?( Ort:| im)? {{loc}}",
					   "^<<ATTR3>>(Beginn)?( und )?<<ATTR>>(Vorbesprechung)?:? ?{{day}}? ?{{date-set}}? ?{{time-int}}( Uhr)?\\s?(Ort:|im|,)? {{loc}}",
					   "^<<ATTR3>>(Beginn)?( und )?<<ATTR>>(Vorbesprechung)?:? ?{{day-set}}\\.?:? ?{{date}}?( von)? {{time-int}}( Uhr)?\\s?(Ort:|im|,)?\\s?{{loc}}[;\\s]+<<ATTR2>>(Beginn:|Block) ({{date-int}}|{{date}})",
					   "^jeweils {{day-set}}:? {{time-int}} Uhr\\. Beginn: {{date}}; Ort: {{loc}}",
					   "^(Vorbesprechung und Beginn(: | am )?)?{{day#}}\\.? {{date}}(,| um) {{time#}}{{text}}[;\\s\\.]+{{day-set}} {{time-int}}( Uhr)?( Ort:|,)? {{loc}}",
					   "^<<ATTR>>(Vorbesprechung Bachelormodul:) ?{{day}}[\\.:]? {{date}}, {{time}}( Uhr)? ?{{academ-q}}?(, |\\n){{loc}}"
					   ],
	
	"compile": 
		function() {
			var repeat = false;
			
			this.patterns = [];
			do {
				repeat = false;
				for(var key in this.abbr) {
					elements = this.abbr[key].match(/\{\{[\w\#\?-]+\}\}/g);
					if(elements) {
						repeat = true;
						for(var i = 0; i < elements.length; i++)
							this.abbr[key] = this.abbr[key].replace(elements[i], this.abbr[elements[i]]);
					}
				}
			}while(repeat);
			//console.log(this.abbr);
			
			for(var i = 0; i < this.patternStrings.length; i++) {
				var current = {"string": "", "extract": {}};
				
				for(var key in this.abbr)
					this.patternStrings[i] = this.patternStrings[i].replace(new RegExp(key, "g"), this.abbr[key]);
				
				var cutted = this.patternStrings[i].cut(this.targets);
				
				//console.log(cutted);
				
				var brackets = 1;
				var compiled_string = ""
				for(var j = 0; j < cutted.length; j++) {
					if(this.targets.indexOf(cutted[j]) >= 0) {
						if(current["extract"][cutted[j]] == undefined)
							current["extract"][cutted[j]] = [];
						current["extract"][cutted[j]].push(brackets);
					}else {
						brackets = brackets + cutted[j].count("(");
						compiled_string = compiled_string + cutted[j];
					}
				}
				current["string"] = compiled_string;
				current["pattern"] = new RegExp(compiled_string, "i");
				
				//console.log("compiled:");
				console.log(current);
				//console.log("");
				
				this.patterns.push(current);
			}
			
			this.compiled = true;
		},
	
	"parse":
		function(text) {
			if(this.compiled == false)
				this.compile();
			
			var result = undefined;
			for(var i = 0; i < this.patterns.length; i++) {
				var r = text.match(this.patterns[i].pattern);
				if(r) {
					result = {};
					result["<<PATTERN_ID>>"] = i;
					result["<<MATCHED_STRING>>"] = r[0];
					
					for(var key in this.patterns[i].extract) {
						for(var j = 0; j < this.patterns[i].extract[key].length; j++) {
							//console.log(key + ": " + r[this.patterns[i].extract[key][j]]);
							if(r[this.patterns[i].extract[key][j]] != undefined) {
								if(result[key] == undefined)
									result[key] = []
								result[key] = r[this.patterns[i].extract[key][j]];
							}
						}
					}
				}
			}
			return result;
		}
};

function rwAttr(attr) {
	rules = {"MO": "MO", "DI": "TU", "MI": "WE", "DO": "TH", "FR": "FR", "SA": "SA", "SO": "SU",
			 "Mo": "MO", "Di": "TU", "Mi": "WE", "Do": "TH", "Fr": "FR", "Sa": "SA", "So": "SU",
			 "Montag": "MO", "Dienstag": "TU", "Mittwoch": "WE", "Donnertag": "TH", "Freitag": "FR",
			 "Samstag": "SA", "Sonntag": "Sunday",
			 "wtl": "WEEKLY", "14-tg": "EVERY_OTHER_WEEK"};
	
	if(attr instanceof Array) {
		var tmp = [];
		for(var i = 0; i < attr.length; i++)
			if(rules[attr[i]] != undefined)
				tmp.push(rules[attr[i]]);
		return tmp;
	}
	return rules[attr];
}

function incrementByHour(tm) {
	var atm = tm.split(":");
	atm[0] = "00" + ((parseInt(atm[0]) + 1)%24)
	return atm[0].substring(atm[0].length - 2) + ":" + atm[1];
}

function academicQuater(tm, sct) {
	var atm = tm.split(":");
	var mins = parseInt(atm[0])*60 + parseInt(atm[1]) + (sct == "s.t" ? 0: sct == "c.t." ? 15 : 0);
	
	atm[1] = "00" + (mins % 60);
	atm[0] = "00" + ((mins / 60) % 24);
	return atm[0].substring(atm[0].length - 2) + ":" + 
		   atm[1].substring(atm[1].length - 2);
}

function extractDateTimePlace(text) {
	text = text.replace(/\n+/g, '\n')
	text = text.replace(/[^\S\n]+/g, ' ').trim();
	
	var res = new Array();
	var parsed;
	var begin_date_min = null, event_first_date = null;
	
	var counter = 0;
	do {
		//console.log("BEGIN DATE: " + begin_date_min);
		//console.log("##### PARSE: "+text);
		
		/*if(text.length > 100)
			console.log("Parse: " + text.substr(0, 100) + "...");
		else
			console.log("Parse: " + text);*/
		
		var pt = eventPattern.parse(text);
		
		if(pt) {
			var entry = {};
			
			console.log(pt);
			
			if(pt["<<FROM>>"]) {
				entry["FROM"] =     pt["<<FROM>>"].replace(".", ":");
				entry["UNTIL"] =    pt["<<UNTIL>>"].replace(".", ":");
			}else if(pt["<<TIME>>"]) {
				if(entry["<<ACADEM_Q>>"])
					entry["FROM"] = academicQuater(pt["<<TIME>>"].replace(".", ":"), pt["<<ACADEM_Q>>"]);
				else
					entry["FROM"] = pt["<<TIME>>"].replace(".", ":");
				entry["UNTIL"] =    incrementByHour(pt["<<TIME>>"].replace(".", ":"));
				
			}
			entry["LOCATION"] = pt["<<LOCATION>>"];
			
			switch(pt["<<PATTERN_ID>>"]) {
				case 0: 
					entry["ATTR"] = pt["<<ATTR>>"] && pt["<<ATTR3>>"] == undefined ? "Vorbesprechung" : undefined;
					entry["FREQ"] =            rwAttr(pt["<<FREQ>>"]);
					entry["DAYS"] =            rwAttr(pt["<<DAY>>"]) != undefined ? [rwAttr(pt["<<DAY>>"])] : [];
				
					if(pt["<<DATE>>"] == undefined) {
						entry["FIRST_DATE"] = pt["<<FIRST_DATE>>"];
						entry["LAST_DATE"] = pt["<<LAST_DATE>>"];
					}else {
						entry["DATE"] = pt["<<DATE>>"];
						event_first_date = pt["<<DATE>>"];
					}
					//console.log("push entry:");
					//console.log(entry);
					res.push(entry);
					//console.log("");
					break;
				case 1: 
					entry["ATTR"] = pt["<<ATTR>>"] && pt["<<ATTR3>>"] == undefined ? "Vorbesprechung" : undefined;
					entry["DAYS"] =            rwAttr(pt["<<DAY>>"]) != undefined ? [rwAttr(pt["<<DAY>>"])] : [];
					
					if(pt["<<DATE_SET>>"]) {
						date_set = pt["<<DATE_SET>>"].split(new RegExp(eventPattern.abbr["{{set-sep}}"], "i"));
						
						if(pt["<<ATTR>>"])
							event_first_date = date_set[0];
					
						for(var j = 0; j < date_set.length; j++) {
							if(date_set[j].match(eventPattern.abbr["{{date#}}"])) {
								entry["DATE"] = date_set[j];
								var tmp_entry = clone(entry);
								//console.log("push entry: ");
								//console.log(tmp_entry);
								res.push(tmp_entry);
								//console.log("");
							}
						}
					}else {
						entry["FIRST_DATE"] = event_first_date;
						entry["FREQ"] = "WEEKLY";
						//console.log("push entry:");
						//console.log(entry);
						res.push(entry);
						//console.log("");
					}
					break;
				case 2:
					entry["ATTR"] = pt["<<ATTR>>"] && pt["<<ATTR3>>"] == undefined ? "Vorbesprechung" : undefined;
					entry["DAYS"] =            pt["<<DAY_SET>>"] != undefined ? rwAttr(pt["<<DAY_SET>>"].split(new RegExp(eventPattern.abbr["{{set-sep}}"], "i"))) : [];
					
					if(pt["<<ATTR2>>"] == "Beginn:")
						entry["FREQ"] = "WEEKLY";
					
					if(pt["<<DATE>>"]) {
						entry["DATE"] = pt["<<DATE>>"];
						if(pt["<<ATTR>>"])
							event_first_date = pt["<<DATE>>"];
					}else {
						entry["FIRST_DATE"] = pt["<<FIRST_DATE>>"];
						entry["LAST_DATE"] = pt["<<LAST_DATE>>"];
						if(pt["<<ATTR>>"])
							event_first_date = pt["<<FIRST_DATE>>"];
					}
					
					//console.log("push entry:");
					//console.log(entry);
					res.push(entry);
					//console.log("");
					break;
				case 3:
					entry["DAYS"] = rwAttr(pt["<<DAY_SET>>"].split(/, | und /));
					entry["FREQ"] = "WEEKLY";
					entry["FIRST_DATE"] = pt["<<DATE>>"];
						
					//console.log("push entry:");
					//console.log(entry);
					res.push(entry);
					//console.log("");
					break;
				case 4:
					entry["DAYS"] = rwAttr(pt["<<DAY_SET>>"].split(/, | und /));
					entry["FREQ"] = "WEEKLY";
					entry["FIRST_DATE"] = pt["<<DATE>>"];
						
					//console.log("push entry:");
					//console.log(entry);
					res.push(entry);
					//console.log("");
					break;
				case 5:"^<<ATTR>>(Vorbesprechung Bachelormodul:) ?{{day}} {{date}}( Uhr)? ?{{academ-q}}?(, |\n){{loc}}"
					entry["ATTR"] = pt["<<ATTR>>"] ? "Vorbesprechung" : undefined;
					entry["DAYS"] = rwAttr(pt["<<DAY>>"]);
					entry["DATE"] = pt["<<DATE>>"];
					
					//console.log("push entry:");
					//console.log(entry);
					res.push(entry);
					//console.log("");
					break;
			}
			text = text.substr(pt["<<MATCHED_STRING>>"].length+1, text.length).trim();
			parsed = pt; // DEBUG!!! replace all parsed with pt
		}else {
			next = text.indexOf("\n");
			if(next == -1)
				break;
			else
				text = text.substr(next + 1, text.length).trim();
		}
		counter++;
	}while(text.length > 0 && counter < 20);
	
	return res;
}

function parseEntry(entry) {
	var result = new Array();
	
	current = {}
	current["lecturers"] = new Array();
	
	for(var j = 0; j < entry.childNodes.length; j++) {
		var content = undefined;
		switch(entry.childNodes[j].className) {
			case "vlvz_langtitel":
				content = entry.childNodes[j].childNodes;
				for(var i = 0; i < content.length; i++) {
					if(content[i].tagName == "ABBR")
						current["type"] = content[i].textContent.trim();
					if(content[i].className == "vlvz_titel")
						current["title"] = content[i].textContent.trim();
					if(content[i].nodeType == 3)
						current["id"] = content[i].textContent.trim();
				}
				//console.log("VLVZ_LANGTITEL: " + current["type"] + ", " + current["title"] + ", " + current["id"]);
				break;
			case "vlvz_institut":
				content = entry.childNodes[j].childNodes;
				for(var i = 0; i < content.length; i++) {
					if(content[i].tagName == "A")
						current["institute"] = content[i].textContent;
				}
				//console.log("VLVZ_INSTITUT: " + current["institute"]);
				break;
			case "vlvz_wochenstunden":
				current["credits"] = entry.childNodes[j].textContent.replace(/\s+/g, ' ');
				//console.log("VLVZ_WOCHENSTUNDEN: " + current["credits"].replace(/\s+/g, ' '));
				break;
			case "vlvz_vlsprache":
				current["language"] = entry.childNodes[j].textContent;
				//console.log("VLVZ_SPRACHE: " + current["language"]);
				break;
			case "vlvz_vortragende":
				content = entry.childNodes[j].childNodes;
				for(var i = 0; i < content.length; i++) {
					if(content[i].tagName == "A")
						current["lecturers"].push(content[i].textContent.trim());
				}
				//console.log("VLVZ_VORTRAGENDE: " + current["lecturers"].join(", "));
				break;
			case "vlvz_termine":
				current["date_time_place"] = extractDateTimePlace(entry.childNodes[j].textContent);
				if(current["date_time_place"].length > 0) {
					result.push(clone(current));
					current["lecturers"] = new Array();
				}
				//console.log("VLVZ_TERMINE: ");
				//for(var i = 0; i < current["date_time_place"].length; i++)
				//	console.log(current["date_time_place"][i]);
				break;
		}
	}
	
	/*for(var i = 0; i < result.length; i++) {
		console.log(result[i]);
	}*/
	return result; 
}

function parseCourses() {
	if (getLocation(document.URL).hostname == "online.univie.ac.at") {
		if(checkBoxesSet == false) {
			courses = document.querySelectorAll(".farbe1, .farbe2");
		
			for(var i = 0; i < courses.length; i++) {
				var info = courses[i].childNodes;
			
				for(var j = 0; j < info.length; j++) {
					if(info[j].className == "vlvz_langtitel") {
						var checkbox = document.createElement("input");
						checkbox.type = "checkbox";
						checkbox.onclick = function(curcb, course) {
									return function() {
										if(curcb.checked) {
											pc = parseEntry(course);
											//console.log("NOW PUSH: " + pc["id"]);
											chrome.runtime.sendMessage({instruction: "enable", courses: pc, debug: "TEST_ENABLE"});
										}else {
											pc = parseEntry(course);
											chrome.runtime.sendMessage({instruction: "disable", courses: pc, debug: "TEST_DISABLE"});
										}
									};
								}(checkbox, courses[i]);
					
						info[j].insertBefore(checkbox, info[j].firstChild);
					}
				}
			}
			checkBoxesSet = true;
		}
		return true;
	} else {
		return null;
	}
}

