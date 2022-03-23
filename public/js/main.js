import * as store from './store.js';
import * as wss from './wss.js';
import * as webRTCHandler from './WebRTCHandler.js';
import * as constants from './constants.js';
import { getIncomingCallDialog } from './elements.js';

// inicializacion de conexion de SocketIO
const socket = io("/");
wss.registerSockerEvents(socket);

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
