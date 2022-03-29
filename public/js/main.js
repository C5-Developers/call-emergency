import * as store from './store.js';
import * as wss from './wss.js';
import * as webRTCHandler from './WebRTCHandler.js';
import * as constants from './constants.js';
import * as ui from './ui.js'

// inicializacion de conexion de SocketIO
const socket = io("/");
wss.registerSockerEvents(socket);

webRTCHandler.getLocalPreview();

//evento para copiar codigo personal
const personalCodeCopyButton = document.getElementById('personal_code_copy_button');

personalCodeCopyButton.addEventListener('click', () => {
   const personalCode = store.getState().socketId;
   navigator.clipboard && navigator.clipboard.writeText(personalCode);
});

// evento para botones de conexion
const personalCodeChatButton = document.getElementById('personal_code_chat_button');

const personalCodeVideoButton = document.getElementById('personal_code_video_button');

personalCodeChatButton.addEventListener('click', () => {
    console.log('chat button click');

    const calleePersonalCode = document.getElementById('personal_code_input').value;
    const callType = constants.callType.CHAT_PERSONAL_CODE;    

    webRTCHandler.sendPreOffer(callType, calleePersonalCode);

})

personalCodeVideoButton.addEventListener('click', () => {
    console.log('video chat button click');

    const calleePersonalCode = document.getElementById('personal_code_input').value;
    const callType = constants.callType.VIDEO_PERSONAL_CODE;

    webRTCHandler.sendPreOffer(callType, calleePersonalCode);
})

// event listeners para botones de videollamada

const micButton = document.getElementById('mic_button');
micButton.addEventListener('click',()=>{
    const localStream = store.getState().localStream;
    const micEnabled = localStream.getAudioTracks()[0].enabled;
    localStream.getAudioTracks()[0].enabled = !micEnabled;
    ui.updateMicButton(micEnabled); 
})

const cameraButton = document.getElementById('camera_button');
cameraButton.addEventListener('click', ()=>{
    const localStream = store.getState().localStream;
    const cameraEnabled = localStream.getVideoTracks()[0].enabled;
    localStream.getVideoTracks()[0].enabled = !cameraEnabled;
    ui.updateCameraButton(cameraEnabled);
});

const switchForScreenSharingButton = document.getElementById('screen_sharing_button');

switchForScreenSharingButton.addEventListener('click',() => {
    const screenSharingActive = store.getState().screenSharingActive;
    webRTCHandler.switchBetweenCameraAndScreenSharing(screenSharingActive);
})

// chat

const newMessageInput = document.getElementById('new_message_input');
newMessageInput.addEventListener('keydown', (event) => {
    console.log('change ocurred');
    const key = event.key;

    if( key === 'Enter'){
        webRTCHandler.sendMessageUsingDataChannel(event.target.value);
        ui.appendMessage(event.target.value, true);
        newMessageInput.value = '';
    }
});

const sendMessageButton = document.getElementById('send_message_button');
sendMessageButton.addEventListener('click', () => {
    const message = newMessageInput.value;
    webRTCHandler.sendMessageUsingDataChannel(message);
    ui.appendMessage(event.target.value, true);
    newMessageInput.value = '';
})