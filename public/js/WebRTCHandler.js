import * as wss from './wss.js';
import * as constants from './constants.js';
import * as ui from './ui.js';
import * as store from './store.js';

let connectedUserDetails;
let peerConection

const defaultconstraints= {
    audio : true,
    video : true
}

const configuration = {
    iceServer: [
        {
            urls: 'stun:stun.l.google.com:13902'
        }
    ]
}

//Acceder a camaras locales Webrtc
export const getLocalPreview = () => {
    navigator.mediaDevices.getUserMedia(defaultconstraints)
    .then((stream)=>{
        ui.updateLocalVideo(stream);
        store.setLocalStream(stream);
    })
    .catch((err) =>{
        console.log('ocurrio un error al tratar de accesar a la camara');
        console.log(err);
    })
};

const createPeerConnection = () => {
    peerConection = new RTCPeerConnection(configuration);

    peerConection.onicecandidate = (event) => {
        console.log('getting ice candidates from stun server');
        if (event.candidate){
            // send oir ice candidate to other peer
            wss.sendDataUsingWebRTCSignaling({
                connectedUserSocketId: connectedUserDetails.socketId,
                type:constants.webRTCSignaling.ICE_CANDITATE,
                candidate: event.candidate,
            })
        }
    }

    peerConection.oniceconnectionstatechange = (event) => {
        if (peerConection.connectionState === 'connected'){
            console.log('Conectado exitosamente con otro usuario');
        }
    }

    //Track

    const remoteStream = new MediaStream();
    store.setRemoteStream(remoteStream);
    ui.updateRemoteVideo(remoteStream);

    peerConection.ontrack = (event) => {
        remoteStream.addTrack(event.track);
    }

    if(connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE){
        const localStream = store.getState().localStream;

        for(const track of localStream.getTracks()){
            peerConection.addTrack(track.localStream);
        }
    }
}

export const sendPreOffer = (callType, calleePersonalCode) => {

   connectedUserDetails = {
       callType,
       socketId: calleePersonalCode
   }

   if(callType === constants.callType.CHAT_PERSONAL_CODE || callType === constants.callType.VIDEO_PERSONAL_CODE){
       
          const data = {
              callType,
              calleePersonalCode
           };
           ui.showCallingDialog(callingDialogRejetHandler);
           wss.sendPreOffer(data);
   }

};

export const handlePreOffer = (data) => {
    const { callType, callerSocketId } = data;

    connectedUserDetails = {
        socketId: callerSocketId,
        callType,
    };

    if (callType === constants.callType.CHAT_PERSONAL_CODE || callType === constants.callType.VIDEO_PERSONAL_CODE){
        ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
    }
};

const acceptCallHandler = () => {
    console.log('llamada aceptada');
    createPeerConnection();
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
    ui.showCallElements(connectedUserDetails.callType);

}

const rejectCallHandler = () => {
    console.log('llamada rechazada');
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
}

const callingDialogRejetHandler = () =>{
    console.log("rechazando llamada");
}

const sendPreOfferAnswer = (preOfferAnswer) => {
    const data = {
        callerSocketId: connectedUserDetails.socketId,
        preOfferAnswer,
    };
    ui.removeAllDialogs();
    wss.sendPreOfferAnswer(data);
}

export const handlePreOfferAnswer = (data) => {
    const { preOfferAnswer } = data;
    
    ui.removeAllDialogs();

    if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND){
        ui.showInfoDialog(preOfferAnswer);
        //show dialog that callee has not been found
    }

    if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
        ui.showInfoDialog(preOfferAnswer);
        // show dialog thath calle is not able to connect
    }

    if(preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED){
        ui.showInfoDialog(preOfferAnswer);
        // shoe dialog that call is rejected by the calle
    }

    if(preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED){
        ui.showCallElements(connectedUserDetails.callType);
        createPeerConnection();
        sendWebRTCOffer();
    }

};

const sendWebRTCOffer = () => {
    const offer = await peerConection.createOffer();
    await peerConection.seLocalDescription(offer);
    wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type : constants.webRTCSignaling.OFFER,
        offer: offer
    })
}

export const handleWebRTCOffer = async (data) => {
    await peerConection.setRemoteDescription(data.offer);
    const answer = await peerConection.createAnswer();
    await peerConection.seLocalDescription(answer);
    wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId : connectedUserDetails.socketId,
        type: constants.webRTCSignaling.ANSWER,
        answer:answer
    });
};

export const handleWebRTCAnswer = async (data) => {
    console.log('handling rtc answer');
    await peerConection.setRemoteDescription(data.answer);
}

export const handleWebRTCCandidate = async (data) => {
    console.log("handling incoming webRTC Candidate ");
    try {
        await peerConection.addIceCandidate(data.candidate);
    } catch (error) {
        console.log('Ocurrio un error al tratar de agregar recibir ice candidate',
        error);
    }
}

let screenSharingStream;

export const switchBetweenCameraAndScreenSharing = (screenSharingActive) => {
    if (screenSharingActive) {
        const localStream = store.getState().localStream;
        const senders = peerConection.getSenders();

        const sender = senders.find((sender) => {
            return sender.track.kind === localStream.getVideoTrack()[0].kind;
        })

        if (sender){
            sender.replaceTrack(localStream.getVideoTracks()[0]);
        }

        store.getState().screenSharingStream.getTracks().forEach((track)=> track.stop());

        store.setScreenSharingActive(!screenSharingActive);

        ui.updateLocalVideo(localStream);

    } else {
        console.log('switching for screen sharing');
        try {
            screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            })
            store.setScreenSharingStream(screenSharingStream);

            const senders = peerConection.getSenders();

            const sender = senders.find((sender) => {
                return sender.track.kind === screenSharingStream.getVideoTrack()[0].kind;
            })

            if (sender){
                sender.replaceTrack(screenSharingStream.getVideoTracks()[0]);
            }
            store.setScreenSharingActive(!screenSharingActive);
            ui.updateLocalVideo(screenSharingStream);
        } catch (error) {
            console.log('error ocurred when trying stream',error);
        }
    }
}