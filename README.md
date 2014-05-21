#Клиент

##Инициализация
`var WebRTC = $.fn.WebRTC(socket, {});`

##Методы
* call()
* answer()
* play()
* pause()
* disconnect()

##События (задаются в настройках)
`onGetLocalVideo: function (url)`
`onGetRemoteVideo: function (clientId, url)`
`onCall: function (clientId)`
`onError: function (code, text)`

##Настройки
* iceServers
* video

## Пример настройки видео
`video: {
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
 },`

#Сервер

##Инициализация
`var webRTC = require('webrtcio');`
`webRTC.attachSocket(socket);`
