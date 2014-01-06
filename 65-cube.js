/**
 * Copyright 2013 IBM Corp.
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
var util = require("util");
var cube = require("cube");

var cubeConnectionPool = function() {
    var connections = {};
    var obj = {
        get: function(host,port) {
            var id = host+":"+port;
        console.log("Getting cube from pool");
            if (!connections[id]) {
                connections[id] = cube.emitter("ws://"+id);
                console.log("We got a cube");
                connections[id]._id = id;
                connections[id]._nodeCount = 0;
            }
            console.log("Done");
            connections[id]._nodeCount += 1;
            return connections[id];
        },
        close: function(connection) {
            connection._nodeCount -= 1;
            if (connection._nodeCount == 0) {
                if (connection) {
                    connection.close();
                }
                delete connections[connection._id];
            }
        }
    };
    return obj;
}();


function CubeOutNode(n) {
    RED.nodes.createNode(this,n);
    this.port = n.port||"1080";
    this.hostname = n.hostname||"127.0.0.1";
    this.event = n.event;

    this.client = cubeConnectionPool.get(this.hostname,this.port);
    
    this.on("input", function(msg) {
            if (msg != null) {
                var t = this.event || msg.topic;
                if (t) {
                    //console.log("Sending data to cube ->"+msg.payload);
                		this.client.send({
                			type: t,
                			time: msg.datetime || new Date(),
                			data: { "martin" : "jarvis", "pl" : msg.payload }
                		});
                } else {
                    this.warn("No Event or topic set");
                }
            }
    });
}

RED.nodes.registerType("cube out",CubeOutNode);

CubeOutNode.prototype.close = function() {
    cubeConnectionPool.close(this.client);
}

