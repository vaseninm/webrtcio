var _ = require('underscore');

function WebRTC() { }

WebRTC.prototype.attachSocket = function (socket) {
	WebRTCConnection(socket);

	return this;
}

function WebRTCConnection (socket) {
	var io = socket.manager;

	socket.on('offerToClient', function (data) {
		io.sockets.socket(data.id).emit('offerFromClient', {
			id: socket.id,
			type: data.type,
			description: data.description
		});
	});

	socket.on('iceCandidateToClient', function (data) {
		io.sockets.socket(data.id).emit('iceCandidateFromClient', {
			id: socket.id,
			iceCandidate: data.iceCandidate
		});
	});
}

module.exports = new WebRTC();