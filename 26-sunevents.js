/**
 * Copyright 2013 Freak Enterprises
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *  Module Dependencies
 * 	- SunCalc (https://github.com/mourner/suncalc)
 *  - Moment (http://momentjs.com/)
 **/

// Require main module
var RED = require("../../red/red");
var util = require("util");
var SunEvents = require('./lib/sunevents.js');

// The main node definition - most things happen in here
function SunEventsNode(n) {
    // Create a RED node
    RED.nodes.createNode(this,n);

		var node = this;
		
    // Store local copies of the node configuration (as defined in the .html)
		this.latitude = n.latitude;
		this.longitude = n.longitude;
    this.modes = {test: n.testmode, debug: n.verbose};
    this.topic = n.topic;

    node.log("Calculating sun event times.")
    node.events = new SunEvents(this.latitude, this.longitude, this.modes);
    
    node.events.on("sunevent", function(event, date) {
    		var msg = {};
    		msg.topic = event;
    		msg.payload = {event: event, date: date};

				node.log(util.format("Injecting event %s for %s", event, date));
    		// send out the message to the rest of the workspace.
    		node.send(msg);
    });
    
    if (node.modes.debug) {
    		node.events.on("debug", function(msg) {
					node.log(msg);
    		});
    }
    
    // Add any extra configuration to suncalc here
    
    console.log("initialising...");
    node.events.init()
    
    node.on("close", function() {
		// Called when the node is shutdown - eg on redeploy.
		// Allows ports to be closed, connections dropped etc.
		// eg: this.client.disconnect();
			node.events.stop();
	});
}

// Register the node by name. This must be called before overriding any of the
// Node functions.
RED.nodes.registerType("sunevents", SunEventsNode);
