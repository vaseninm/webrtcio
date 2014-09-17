(function () {

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
		audio: true,
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

			var pc = getPeerConnection(clientId, type);

			pc[fn](function (description) {
					description.sdp = description.sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
					description.sdp = description.sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:16\r\n');
					description.sdp = description.sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:64\r\n');
					pc.setLocalDescription(description, function () {

					}, function (error) {
						options.onError(1, error);
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

		var getPeerConnection = function (clientId, type) {
			if (!clientList[clientId]) {

				var pc = new RTCPeerConnection({iceServers: options.iceServers}, {optional: [
					{DtlsSrtpKeyAgreement: true}
				]});

				if (type != 'answer' && !options.answerWithoutMedia) {
					pc.addStream(localStream);
				}
				pc.onaddstream = function (event) {
					var clientId = getClientIdByPeerConnection(event.currentTarget);
					var url = URL.createObjectURL(event.stream);

					options.onGetRemoteVideo(clientId, url);
				};
				pc.onicecandidate = function (iceCandidate) {
					if (!iceCandidate.candidate) return false;
					console.log('candidate: ', iceCandidate.candidate.candidate);

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
			connect: function (sock, params) {
				for (i in defaults) {
					if (params[i] !== undefined) {
						options[i] = params[i];
					} else if (options[i] === undefined) {
						options[i] = defaults[i];
					}
				}

				if (options.audio || options.video) {
					getUserMedia({
						audio: options.audio,
						video: options.video
					}, function (stream) {
						localStream = stream;
						if (sock) this.attach(sock);
						options.onGetLocalVideo(URL.createObjectURL(stream));
					}, function (error) {
						options.onError(2, error);
					});
				}

				return this;
			},
			attach: function (sock) {
				socket = sock;

				socket.on('offerFromClient', function (data) {
					var pc = getPeerConnection(data.id);

					data.description.sdp = data.description.sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
					data.description.sdp = data.description.sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:16\r\n');
					data.description.sdp = data.description.sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:64\r\n');


					pc.setRemoteDescription(new RTCSessionDescription(data.description), function () {
						if (data.type === 'offer') {
							options.onCall(data.id);
						}
					}, function (error) {
						options.onError(3, error);
					});
				})

				socket.on('iceCandidateFromClient', function (data) {
					var pc = getPeerConnection(data.id);
					var candidate = new RTCIceCandidate(data.iceCandidate.candidate);

					pc.addIceCandidate(candidate);
				})

				return this;
			},
			call: function (clientId) {
				sendOffer(clientId, 'offer');

				return this;
			},
			answer: function (clientId) {
				sendOffer(clientId, 'answer');

				return this;
			},
			videoPlay: function () {
				var tracks = localStream.getVideoTracks();
				if (tracks.length > 0)
					tracks[0].enabled = true;

				return this;
			},
			videoPause: function () {
				var tracks = localStream.getVideoTracks();
				if (tracks.length > 0)
					tracks[0].enabled = false;

				return this;
			},
			audioPlay: function () {
				var tracks = localStream.getAudioTracks();
				if (tracks.length > 0)
					tracks[0].enabled = true;

				return this;
			},
			audioPause: function () {
				var tracks = localStream.getAudioTracks();
				if (tracks.length > 0)
					tracks[0].enabled = false;

				return this;
			},
			setOption: function (key, value) {
				options[key] = value;

				return this;
			},
			setOptions: function (options) {
				for (key in options) {
					this.setOption(key, options[key]);
				}

				return this;
			},
			removePeer: function(clientId){
			    var peer = clientList[clientId];		
			    if (peer){
					peer.close();
					delete clientList[clientId];
			    }
			}
		};
	}.call();

	if (typeof define === 'function' && define.amd) {
		define(function () {
			return webRTC;
		});
	} else {
		this.webRTC = webRTC;
	}
}).call(this);
