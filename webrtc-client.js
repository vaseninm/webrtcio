(function(){

	var defaults = {
		iceServers: [
			{url: 'stun:stun.l.google.com:19302'},
			{url: 'stun:stun1.l.google.com:19302'},
			{url: 'stun:stun2.l.google.com:19302'},
			{url: 'stun:stun3.l.google.com:19302'},
			{url: 'stun:stun4.l.google.com:19302'},
			{url: 'stun:stun01.sipphone.com'},
			{url: 'stun:stun.ekiga.net'},
			{url: 'stun:stun.fwdnet.net'},
			{url: 'stun:stun.ideasip.com'},
			{url: 'stun:stun.iptel.org'},
			{url: 'stun:stun.rixtelecom.se'},
			{url: 'stun:stun.schlund.de'},
			{url: 'stun:stunserver.org'},
			{url: 'stun:stun.softjoys.com'},
			{url: 'stun:stun.voiparound.com'},
			{url: 'stun:stun.voipbuster.com'},
			{url: 'stun:stun.voipstunt.com'},
			{url: 'stun:stun.voxgratia.org'},
			{url: 'stun:stun.xten.com'},
			{
				url: 'turn:numb.viagenie.ca',
				credential: 'muazkh',
				username: 'webrtc@live.com'
			},
			{
				url: 'turn:192.158.29.39:3478?transport=udp',
				credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
				username: '28224511:1379330808'
			},
			{
				url: 'turn:192.158.29.39:3478?transport=tcp',
				credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
				username: '28224511:1379330808'
			}
		],
		video: {
			mandatory: {
				maxWidth: 400,
				maxHeight: 300
			},
			optional: [
				{
					minWidth: 120
				},
				{
					minHeight: 90
				},
				{
					maxWidth: 300
				},
				{
					maxHeight: 200
				}
			]
		},
		onGetLocalVideo: function (url) {
		},
		onGetRemoteVideo: function (clientId, url) {
		},
		onCall: function (clientId) {
		},
		onError: function (code, text) {
		}
	};

	var webRTC = function () {

		/* Переменные */
		var localStream = null;
		var clientList = {};
		var options = {};
		var socket;

		/* Приватные функции */
		var sendOffer = function (clientId, type) {
			if (type === 'offer') {
				var fn = 'createOffer';
			} else if (type === 'answer') {
				var fn = 'createAnswer';
			} else {
				throw new Error();
			}

			console.log('Вызван', fn);

			var pc = getPeerConnection(clientId);

			pc[fn](function (description) {
					pc.setLocalDescription(description, function () {
						console.log('Локал дескрипшн установлен');
					}, function (error) {
						console.log('Возникла ошибка', error);
					});

					socket.emit('offerToClient', {
						id: clientId,
						type: type,
						description: description
					});
				}, function (error) {
					console.log(error)
				},
				{ mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true } }
			);
		}

		var getPeerConnection = function (clientId) {
			if (!clientList[clientId]) {

				var pc = new RTCPeerConnection({iceServers: options.iceServers});

				pc.addStream(localStream);
				pc.onaddstream = function (event) {
					console.log('Получен удаленый стрим');

					var clientId = getClientIdByPeerConnection(event.currentTarget);
					var url = URL.createObjectURL(event.stream);

					options.onGetRemoteVideo(clientId, url);
				};
				pc.onicecandidate = function (iceCandidate) {
					console.log('Получен айс кандидат от сервера');

					if (!iceCandidate.candidate) return false;

					var clientId = getClientIdByPeerConnection(iceCandidate.currentTarget);

					socket.emit('iceCandidateToClient', {
						id: clientId,
						iceCandidate: iceCandidate
					});
				};

				clientList[clientId] = pc;
			}

			return clientList[clientId];
		}

		var getClientIdByPeerConnection = function (pc) {
			for (id in clientList) {
				if (clientList[id] === pc) {
					return id;
				}
			}

			return null;
		}

		return {
			connect: function(sock, params) {
				for(i in defaults) {
					if (params[i] !== undefined) {
						options[i] = params[i];
					} else {
						options[i] = defaults[i];
					}
				}

				getUserMedia({
					audio: true,
					video: options.video
				}, function (stream) {
					console.log('Получено локальное видео');

					localStream = stream;

					if (sock) this.attach(sock);

					options.onGetLocalVideo(URL.createObjectURL(stream));
				}, function (error) {
					console.log('Получили ошибку', error);
				});
			},
			disconnect: function(clientId) {
				delete clientList[clientId];
			},
			attach: function(sock){
				socket = sock;

				socket.on('offerFromClient', function (data) {
					console.log('Получен', data.type);

					var pc = getPeerConnection(data.id);

					pc.setRemoteDescription(new RTCSessionDescription(data.description), function () {
						if (data.type === 'offer') {
							options.onCall(data.id);
						}
					}, function (error) {
						console.log('Возникла ошибка', error);
					});
				})

				socket.on('iceCandidateFromClient', function (data) {
					console.log('Получен ice candidate от пользователя');

					var pc = getPeerConnection(data.id);
					var candidate = new RTCIceCandidate(data.iceCandidate.candidate);

					pc.addIceCandidate(candidate);
				})
			},
			call: function (clientId) {
				sendOffer(clientId, 'offer');
			},
			answer: function (clientId) {
				sendOffer(clientId, 'answer');
			},
			play: function () {
				var tracks = localStream.getVideoTracks();
				if (tracks.length > 0)
					tracks[0].enabled = true;
			},
			pause: function () {
				var tracks = localStream.getVideoTracks();
				if (tracks.length > 0)
					tracks[0].enabled = false;
			}
		};
	}.call();

	if (typeof define === 'function' && define.amd) {
		define(function() {
			return webRTC;
		});
	} else {
		this.webRTC = webRTC;
	}
}).call(this);