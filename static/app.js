let room = 0;
const container = document.getElementById('container');
const cameraOn = document.getElementById("camera-on");
const cameraOff = document.getElementById("camera-off");
const microphoneOn = document.getElementById("microphone-on");
const microphoneOff = document.getElementById("microphone-off");
const screenshareOn = document.getElementById("screenshare-on");
const screenshareOff = document.getElementById("screenshare-off");
const participantAdd = document.getElementById("participant-add");
const participantRemove = document.getElementById("participant-remove");
let connected = false;
let screen = false;
let screenTrack;
let mute = true;

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack({width: 400,height:300}).then(track => {
        let video = document.getElementById("local").firstElementChild;
        video.appendChild(track.attach());
        cameraOff.style.display = "block";
        cameraOn.style.display = "none";
        microphoneOff.style.display = "block";
        microphoneOn.style.display = "none";
        screenshareOff.style.display = "none";
        screenshareOn.style.display = "block";
        participantAdd.style.display = "block";
        participantRemove.style.display = "none";
    });
};

function cameraOffHandler() {
    cameraOff.style.display = "none";
    cameraOn.style.display = "block";
    console.log("vypal si kameru");

}

function cameraOnHandler(){
    cameraOff.style.display = "block";
    cameraOn.style.display = "none";
    console.log("zapal si kameru");
}

function microphoneOnHandler(){
    microphoneOff.style.display = "block";
    microphoneOn.style.display = "none";
    console.log("zapal si mic");
    audioMuteHandler();
}

function microphoneOffHandler(){
    microphoneOff.style.display = "none";
    microphoneOn.style.display = "block";
    console.log("vypal si mic");
    audioMuteHandler();
}

function screenOnHandler(){
    screenshareOff.style.display = "block";
    screenshareOn.style.display = "none";
    console.log("zapal si screen");
    shareScreenHandler("norko");
}

function screenOffHandler(){
    screenshareOff.style.display = "none";
    screenshareOn.style.display = "block";
    console.log("vypal si screen");
    shareScreenHandler("norko");
}

function userAddHandler(){
    participantAdd.style.display = "none";
    participantRemove.style.display = "block";
    console.log("pridal si usera");
}

function userRemoveHandler(){
    participantAdd.style.display = "block";
    participantRemove.style.display = "none";
    console.log("odobral si usera");
}

function connect(token) {
    console.log("Connectni se petaneeeee")
    console.log(token)
    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        Twilio.Video.connect(token).then(_room => {
            room = _room;
            room.participants.forEach(participantConnected);
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            resolve();

            connected = true;
            updateParticipantCount();

            //console.log(room)
            resolve()
        }).catch(() => {
            reject();
        });
    });
    console.log(promise)
    return promise;
};

function updateParticipantCount() {
    if (!connected)
        console.log = 'Disconnected.';
    else
        count.innerHTML = (room.participants.size + 1) + ' participants online.';
};

function participantConnected(participant) {
    let participantDiv = document.createElement('div');
    participantDiv.setAttribute('id', participant.sid);
    participantDiv.setAttribute('style', 'border-radius: 10px;border: 5px solid black;margin:40px;');

    let tracksDiv = document.createElement('div');
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement('div');
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    container.appendChild(participantDiv);

    participant.tracks.forEach(publication => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);

    updateParticipantCount();
};

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    updateParticipantCount();
};

function trackSubscribed(div, track) {
    div.appendChild(track.attach());
};

function trackUnsubscribed(track) {
    track.detach().forEach(element => element.remove());
};

function shareScreenHandler(name) {
    //event.preventDefault();

    if (!screen) {
        let screenDiv = document.createElement('div');
        screenDiv.setAttribute('id', name + ' - screen');
        screenDiv.setAttribute('style', 'border-radius: 10px;border: 5px solid black;margin:40px;');
        console.log(screenDiv);
        let tracksDiv = document.createElement('div');
        screenDiv.appendChild(tracksDiv);
        let labelDiv = document.createElement('div');
        screenDiv.appendChild(labelDiv);
        container.appendChild(screenDiv);

        navigator.mediaDevices.getDisplayMedia().then(stream => {
            screenTrack = new Twilio.Video.LocalVideoTrack(stream.getTracks()[0]);
            room.localParticipant.publishTrack(screenTrack);
            screenTrack.mediaStreamTrack.onended = () => { shareScreenHandler() };

            /*let video = document.getElementById("local").firstElementChild;
            video.appendChild(screenTrack.attach());*/

            let video = document.getElementById(name + ' - screen').firstElementChild;
            video.appendChild(screenTrack.attach());

            /* let screenDiv = container.createElement('div');
            screenDiv.setAttribute('id', name + ' - screen');
            screenDiv.setAttribute('style', 'border-radius: 10px;border: 5px solid black;margin:40px;');
            screenDiv.createElement('div').appendChild(screenTrack.attach) */

            console.log(screenTrack);
            //shareScreen.innerHTML = 'Stop sharing';
            screen = true;
        }).catch(() => {
            alert('Could not share the screen.')
        });
    }
    else {
        document.getElementById(name + ' - screen').remove();
        room.localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        screenTrack = null;
        screen = false;
        //shareScreen.innerHTML = 'Share screen';
    }
};

function audioMuteHandler(){
    if(mute){
        room.localParticipant.audioTracks.forEach(publication => {
            publication.track.disable();
          });
        mute = false;
    }
    else {
        room.localParticipant.audioTracks.forEach(publication => {
            publication.track.enable()
          });
        mute = true;
    }    
};
