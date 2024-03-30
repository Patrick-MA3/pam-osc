// pam-OSC. It allows to controll GrandMA3 with Midi Devices over Open Stage Controll and allows for Feedback from MA.
// Copyright (C) 2024  xxpasixx

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>. 

var routing = {};

//The IP to send
var ip = "10.0.16.16";
var oscPort = 9003;
var prefix = "";
var page = "1";
var devices = ['xTouch1.json'];

devices.forEach((config) => {
	const name = config.split('.')[0]
	const value = loadJSON('mappings/' + config, (e) => console.log(e));
	value.buttonFeedbackMapper = eval('(' + value.buttonFeedbackMapper + ')');
	routing[name] = value;
	console.log("loaded mapping: ", config);
});

module.exports = {
	getRoutingByControlerId: function (id) {
		const returnArray = [];
		Object.keys(routing).forEach((device) => {
			const controls = Object.keys(routing[device].control).map((controlId) => ({ id: controlId, value: routing[device].control[controlId] }));
			controls.forEach(control => {
				if (control.value === id || "" + control.value === "" + id) {
					returnArray.push({
						device: device,
						midiId: parseInt(control.id),
					});
					return;
				}
			});
		});
		return returnArray;
	},
	getRoutingNoteByExecId: function (execId) {
		const returnArray = [];
		Object.keys(routing).forEach((device) => {
			const notes = Object.keys(routing[device].note).map((noteId) => ({ id: noteId, value: routing[device].note[noteId].exec }));
			notes.forEach(note => {
				if (note.value == execId) {
					returnArray.push({
						device: device,
						midiId: parseInt(note.id),
						buttonFeedbackMapper: routing[device].buttonFeedbackMapper,
					});
					return;
				}
			});
		});
		return returnArray;
	},
	getRoutingNoteByCMD: function (cmd) {
		const returnArray = [];
		Object.keys(routing).forEach((device) => {

			const notes = Object.keys(routing[device].note).map((noteId) => ({ id: noteId, value: routing[device].note[noteId].cmd }));
			notes.forEach(note => {
				if (!note.value) {
					return;
				}

				if (note.value.toLowerCase() == cmd.toLowerCase()) {
					returnArray.push({
						device: device,
						midiId: parseInt(note.id),
						buttonFeedbackMapper: routing[device].buttonFeedbackMapper,
					});
					return;
				}
			});
		});
		return returnArray;
	},

	oscInFilter: function (data) {
		var { address, args, host, port } = data

		if (host === 'midi') {
			var [channel, ctrl, value] = args.map(arg => arg.value);

			if (address === '/control') {
				if (!routing[port]['control'][ctrl]) {
					return;
				}
				send(ip, oscPort, prefix + "/Page" + page + "/Fader" + routing[port]['control'][ctrl], { type: "i", value: value });
			} else if (address === '/note') {
				var config = routing[port]['note'][ctrl];

				if (!config) {
					return;
				}

				if (config.minValue && value <= config.minValue) {
					return;
				}

				if (config.exec) {
					send(ip, oscPort, prefix + "/Page" + page + "/Key" + config.exec, { type: "i", value: value });
				}

				if (config.quicKey) {
					send(ip, oscPort, prefix + "/cmd", { type: "s", value: 'Go+ Quickey \"' + config.quicKey + '\"' });
				}

				if (config.cmd) {
					send(ip, oscPort, prefix + "/cmd", { type: "s", value: config.cmd });
				}
			}
			return;
		}

		if (host === ip) {
			const addressSplit = address.split('/')
			const fader = address.substring(address.length - 3, address.length);

			if (addressSplit[2].includes('Fader')) {
				const mappings = module.exports.getRoutingByControlerId(fader);
				mappings.forEach((mapping) => {
					send('midi', mapping.device, '/control', 1, mapping.midiId, args[0].value);
				});
			}
			if (addressSplit[2].includes('Button')) {
				const mappings = module.exports.getRoutingNoteByExecId(fader);
				mappings.forEach((mapping) => {
					send('midi', mapping.device, '/note', 1, mapping.midiId, mapping.buttonFeedbackMapper(args[0].value));
				});
			}
			if (address.includes('/updatePage/current')) {
				page = "" + args[0].value;
			}
			if (addressSplit[1].includes('masterEnabled')) {
				const mappings = module.exports.getRoutingNoteByCMD(addressSplit[2]);

				mappings.forEach((mapping) => {
					send('midi', mapping.device, '/note', 1, mapping.midiId, mapping.buttonFeedbackMapper(args[0].value ? 'On' : 'Off'));
				});
			}
		}

		return { address, args, host, port }
	},

}