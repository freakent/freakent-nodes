var SerialResource = './serial-resource';
var rfxcomModule = require("rfxcom");

var serial_resource = new SerialResource(function(){ return new rfxcom.RfxCom("COM32", {debug: true});




