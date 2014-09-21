
var dbg = document.getElementById("debug");

function link(id, action, callback) {
	var element = document.getElementById(id);
	
	switch(element.getAttribute("name")) {
		case "method":
			console.log("linking: " + element.id);
			element[action] = function() { method_select(element, callback); };
			break;
	}
}

function method_select(obj, callback) {
	var str = "";
	
	console.log("calling " + obj.id);
	
	for(var i = 0; i < obj.parentNode.childNodes.length; i++) {
		if(obj.parentNode.childNodes[i].tagName == "DIV")
			if(obj.parentNode.childNodes[i].getAttribute("name") == "method") {
				//str = str + obj.parentNode.childNodes[i].getAttribute("class") + ", ";
				//obj.parentNode.childNodes[i].setAttribute("class", "");
				obj.parentNode.childNodes[i].className = "";
			}
	}
	//dbg.textContent= str; 
	obj.className = "selected";
	
	callback(obj);
}

