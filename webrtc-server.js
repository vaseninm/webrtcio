function WebRTC() { }

WebRTC.prototype.attach = function (socket) {
	WebRTCConnection(socket);

	return this;
}

function WebRTCConnection (socket) {
	socket.on('offerToClient', function (data) {
		socket.to(data.id).emit('offerFromClient', {
			id: socket.id,
			type: data.type,
			description: data.description
		});
	});

	socket.on('iceCandidateToClient', function (data) {
		socket.to(data.id).emit('iceCandidateFromClient', {
			id: socket.id,
			iceCandidate: data.iceCandidate
		});
	});
}

module.exports = new WebRTC();