#Client side

##Init
`var WebRTC = $.fn.WebRTC(socket, config);`

##Methods
* call()
* answer()
* play()
* pause()
* disconnect()

##Events (set in config)
	onGetLocalVideo: function (url)
	onGetRemoteVideo: function (clientId, url)
	onCall: function (clientId)
	onError: function (code, text)

##Params
* iceServers
* video

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
