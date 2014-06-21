#Client side

##Init
	require(['webrtcio'], function(WebRTCio){
		var WebRTC = WebRTCio.connect(socket, config);
		// or
		var WebRTC = WebRTCio.connect(null, config);
		WebRTC.attach(socket);
	});

##Methods
* connect(socket, params)
* attach(socket)
* call(clientId)
* answer(clientId)
* play()
* pause()
* setOptions(options)
* setOption(key, value)

##Events (set in config)
	onGetLocalVideo: function (url)
	onGetRemoteVideo: function (clientId, url)
	onCall: function (clientId)
	onError: function (code, text)

##Params
* iceServers
* video
* audio

## Example config "video"
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
	}

#Server side

##Init
	var webRTC = require('webrtcio');
	webRTC.attachSocket(socket);
