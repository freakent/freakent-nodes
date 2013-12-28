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
 **/

var EventEmitter = require('events').EventEmitter;

function SerialResource(cf) {

	this.port = port;
	this.baud = baud;	
	this.pool = {};
	
	EventEmitter.call(this);
	
	this.create = cf;
	
	this.get = function(port, baud) {
		if (!this.pool[port]) {
		  this.pool[port] = this.create(port);
		}
		return this.pool[port];
	};
	
}

util.inherits(SerialResource, EventEmitter);
module.exports = SerialResource;

