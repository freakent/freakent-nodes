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
 **/

var RED = require(process.env.NODE_RED_HOME+"/red/red");
var util = require('util');
var rfxcom = require("rfxcom");

var commands = {
	'LightwaveRF' : {
		'api'      : function(r) { return new rfxcom.Lighting5(r, rfxcom.lighting5.LIGHTWAVERF); },
		'switchOn' : function(api, addr) { api.switchOn(addr); },
		'switchOff': function(api, addr) { api.switchOff(addr); }
	}
};

function RfxComInNode(n) {      
  RED.nodes.createNode(this,n);
  var node = this;
  
  this.serial = n.serial;
  this.serialConfig = RED.nodes.getNode(this.serial);
        
  if (!node.serialConfig) {
  	node.error("Missing serial port configuration in flow.");
    return;
  }

  function init(port, baud) {
  
  try {

    node.log(util.format("Get RfxCom on %s:%s from pool...", port, baud));  
    node.rfxcom = SerialPool.get(port, baud);            

  } catch(err) {

    node.log(util.format("Failed to get RfxCom on %s", port));
    node.error(err);
    return;

  }
        
    var evNames = [ 'end', 'ready', 'response', 'lighting1', 'lighting2', 'temp1-9', 'th1-9', 'lighting5', 'security1', 'elec2', 'status' ];

    evNames.forEach(function (name) {
        node.rfxcom.on(name, function(event){ 
        	node.log("Received '" + name + "' Event: " + util.inspect(event));
        	node.send({payload: event});
        });
    });
    
    node.rfxcom.on('end', function() {
	setTimeout(function(){ init(port, baud) }, 10000);
    });

  }

  init(this.serialConfig.serialport, this.serialConfig.serialbaud);  

  this.on("close", function() {
    node.rfxcom.removeAllListeners();
  });
}

RED.nodes.registerType("rfxcom in", RfxComInNode);


function RfxComOutNode(n) {      
  RED.nodes.createNode(this,n);
  var node = this;
  this.deviceid = n.deviceid;
  this.subtype = n.subtype;
  this.command = n.command;
  this.serial = n.serial;
  this.serialConfig = RED.nodes.getNode(this.serial);
        
  if (!node.serialConfig) {
  	node.error("Missing serial port configuration in flow.");
    return;
  }

	node.log(util.format("Get RfxCom on %s:%s from pool...", this.serialConfig.serialport, this.serialConfig.serialbaud));  
        
    
  function send(msg) {
    node.rfxcom = SerialPool.get(node.serialConfig.serialport, 
                               node.serialConfig.serialbaud, 
                               function(r) { 
                                 console.log("Resource is ready " + util.inspect(r))
                               } );            
  	if (!node.rfxcom) {
      node.error("No RfxCom module available on " + node.serialConfig.serialport); 
      return;
    }
    if(!node.rfxcom.ready) {
       node.log('RFXCOM was not ready, will try again in 10 seconds');
       setTimeout(function(){send(msg)}, 10000);
       return(msg);
    }
                    
	  addr = node.deviceid || msg.payload.deviceid; // || '0xF13283/1'

    if (!addr) {
      node.error("missing RfxCom destination address");
      return;
    }

	  command = node.command || msg.payload.command;
	          
    node.log(util.format("Send %s to %s, using %s", command, addr, util.inspect(msg)));
    	    
    // Do the magic !
    api = commands[node.subtype].api(node.rfxcom);
    commands[node.subtype][command](api, addr);

    return(msg);
  }

  node.on("input", function(msg) {
    return(send(msg));  
  });
    	    
}

RED.nodes.registerType("rfxcom out", RfxComOutNode);




/**
 * SerialPool - Provides a sharable pool of Serial connections which are used by both 
 *            the inbound and outbound nodes. 
 *
 * ToDo: There's a lot of stuff in here that can probably be pulled out once I'm sure it's not needed
 **/
var SerialPool = function() {
    var pool = {};
    return {
        get: function(port,baud,callback) {
	    console.log("Pool contains " + SerialPool.status());
            var id = port;
            if (!pool[id]) {
            		resource = new rfxcom.RfxCom(port, {debug: true});
            		resource.ready = false;
            		try {
            		  resource.initialise(function() { 
            		  	resource.ready = true;
            		  	resource.on('end', function() {
            		  	  SerialPool.release(port, baud);
            		  	});
            		  	console.log("RfxCom initialised:\n" + util.inspect(resource));
            		  	if (typeof callback == 'function') { callback(pool[id]) };
            		  });
            		} catch (err) {
            			console.log("Resource Initialisation error: " + err);
            		}
            		pool[id] = resource;
            }
            
            //if (!resource.ready) {console.log("resource did not initialise")};
            return pool[id];
        },
        release: function(port, baud) {
          pool[port].serialport.close();
          delete pool[port];
          console.log("Resource " + port + " removed from pool");
        },
        status: function() {
          var keys = [];
          for (key in pool) {
            keys.push(key);
          }
          return keys.join(', ');
        },
        closeAll: function() {
        	for (id in pool) {
        	  resource = pool[id];
        	  //util.log(util.inspect(resource));
        		resource.serialport.close();
        		console.log("Closed " + id);
        	}; 
               pool = {};
        }
    }
}();

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  SerialPool.closeAll();
});


