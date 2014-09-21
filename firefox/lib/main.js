var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var pageMod = require("sdk/page-mod");
var self = require("sdk/self");
var ss = require("sdk/simple-storage")

var gapi_client_id = "1045190187393-8pi97b3vm46ogfk7sej2g4nt2bkcohj6.apps.googleusercontent.com";
var gapi_client_secret = "E3yE0lS5LBH0LXThSTmUTIYX";

var button = null;
var selectedCourses = {};

function showPanel() {
	var popup = require("sdk/panel").Panel({
						width: 820,
						height: 620,
						contentURL: self.data.url("htmlcss/popup.html"),
						contentScriptFile: [self.data.url("js/customelements.js"), 
						                    self.data.url("js/utils.js"), 
						                    self.data.url("js/ical.js"), 
						                    self.data.url("js/gcal.js"), 
						                    self.data.url("js/popup.js")],
						/*onHide: function(runBackground) { 
									if(runBackground)
										popup.hide();
									else
										popup.destroy(); 
								}*/
						});
	popup.port.on("clear-courses", function() {
		selectedCourses = {};
	});
	popup.port.on("open-tab", function(msg) {
		popup.hide();
		msg.onReady = function(tab) {
			var sc = tab.title.match(/^Success code=(.+)/i); 
			if(sc) {
				popup.port.emit("success-code", sc[1]);
				tab.close();
			}else if(tab.title.match(/^Denied error=(.+)/i)) {
				popup.port.emit("success-code", undefined);
				tab.close();
			}
		};
		tabs.open(msg);
	});
	popup.port.on("store-data", function(data) {
		for(var key in data) {
			//console.log("storing: " + key +  " => " + data[key]);
			ss.storage[key] = data[key];
		}
	});
	popup.port.on("show-panel", function() {
		popup.show();
	});
	
	popup.port.emit("init-params", 
		{
			courses: selectedCourses, 
			client_id: gapi_client_id, 
			client_secret: gapi_client_secret,
			auth_credentials: (ss.storage["auth-credentials"] ? ss.storage["auth-credentials"] : {})
		});
}

toggleButton = function(tab) {
	if(tab.url) {
		if(tab.url.match("http://online.univie.ac.at/vlvz*")) {
			if(button == null) {
				button = buttons.ActionButton({
					id: "export-window",
					label: "Export courses",
					icon: {
						"16": "./img/icon-16.png",
						"32": "./img/icon-32.png",
						"64": "./img/icon-64.png"
					},
					onClick: function() {
						showPanel();
					}
				});
			}
		}else {
			if(button != null) {
				button.destroy();
				button = null;
			}
		}
	}
}

tabs.on('ready', toggleButton);
tabs.on('activate', toggleButton);

require("sdk/context-menu").Item({
		  label: "Open Window",
		  contentScript: 'self.on("click", function (node, data) {' +
				         '  window.open("http://stackoverflow.com/questions/14572412/how-to-open-a-popup-window-via-firefox-addon-contextual-menu");' +
				         '});'
		});

pageMod.PageMod({
	include: "http://online.univie.ac.at/vlvz*",
	contentScriptFile: [self.data.url("js/utils.js"), self.data.url("js/parser.js")],
	onAttach: startListening
});

function startListening(worker) {
	worker.port.on("parser-result", function(msg) {
		var courses = msg["courses"];

		if(msg["instruction"] == "enable")
			if(courses[0])
				selectedCourses[courses[0]["id"]] = courses;
		else
			if(courses[0])
				selectedCourses[courses[0]["id"]] = undefined;
	});
}

