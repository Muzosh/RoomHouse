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
let video = true;

firstLoad();

function firstLoad() {
    //uvodne nastavenie ikoniek
    cameraOn.style.display = "block"; //zapata kamera
    cameraOn.style.color = "#00cc00"; //zapata zelena kamera
    cameraOff.style.display = "none";
    microphoneOn.style.display = "block"; //zapaty mic

    microphoneOn.style.color = "#00cc00"; //zapaty zeleny mic
    microphoneOff.style.display = "none";

    screenshareOn.style.display = "block"; //zapata moznost zdielania screenu
    screenshareOn.style.color = "white";
    screenshareOff.style.display = "none";

    participantAdd.style.display = "block"; //zapata moznost pridania usera
    participantRemove.style.display = "none";
    participantAdd.style.color = "white";
}

function cameraOnHandler() {
    //zapatie kamery
    cameraOn.style.display = "block";
    cameraOn.style.color = "#00cc00";
    cameraOff.style.display = "none";
    muteOrUnmuteYourMedia(room, 'video', 'unmute')
    //console.log("zapal si kameru");
}

function cameraOffHandler() {
    //vypnutie kamery
    cameraOff.style.display = "block";
    cameraOff.style.color = "#cc0000";
    cameraOn.style.display = "none";
    //console.log("vypal si kameru");
    muteOrUnmuteYourMedia(room, 'video', 'mute')
}

function microphoneOnHandler() {
    //zapatie mic
    microphoneOn.style.display = "block";
    microphoneOn.style.color = "#00cc00";
    microphoneOff.style.display = "none";
    //console.log("zapal si mic");
    //audioMuteHandler();
    muteOrUnmuteYourMedia(room, 'audio', 'unmute')
}

function microphoneOffHandler() {
    //vypatie mic
    microphoneOff.style.display = "block";
    microphoneOff.style.color = "#cc0000";
    microphoneOn.style.display = "none";
    //console.log("vypal si mic");
    //audioMuteHandler();
    muteOrUnmuteYourMedia(room, 'audio', 'mute')
}

function userAddHandler() {
    //pridanie usera
    participantAdd.style.display = "block";
    participantAdd.style.color = "#00cc00";
    participantRemove.style.display = "none";
    //console.log("pridal si usera");
}

function userRemoveHandler() {
    //odobranie usera
    participantRemove.style.display = "none";
    participantRemove.style.color = "#cc0000";
    participantAdd.style.display = "none";
    //console.log("odobral si usera");
}

function muteOrUnmuteYourMedia(room, kind, action) {
    const publications = kind === 'audio' ? room.localParticipant.audioTracks : room.localParticipant.videoTracks;

    publications.forEach(publication => {
        if (action === 'mute') {
            publication.track.disable();
        } else {
            publication.track.enable();
        }
    });
}

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack({
        width: 400,
        height: 300,
        resizeMode: "crop-and-scale"
    }).then(track => {
        let video = document.getElementById("local").firstElementChild;
        video.appendChild(track.attach());
    });
};

function connect(token, roomId) {
    Twilio.Video.createLocalTracks({
        audio: true,
        video: {
            width: 400,
            height: 300
        }
    }).then(localTracks => {
        return Twilio.Video.connect(token, {
            name: roomId,
            tracks: localTracks,
            bandwidthProfile: {
                video: {
                  mode: 'grid',
                  maxTracks: 0,
                  renderDimensions: {
                    high: {height:1080, width:1920},
                    standard: {height:720, width:1280},
                    low: {height:176, width:144}
                  }
                }
              },
            maxAudioBitrate: 16000, //For music remove this line
            //For multiparty rooms (participants>=3) uncomment the line below
            preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
            networkQuality: {
                local: 1,
                remote: 1
            }
        });
    }).then(room => {
        console.log('Successfully joined a Room: ', room.name);

        room.participants.forEach(participantConnected);

        room.on('participantConnected', participantConnected);
        room.on('participantDisconnected', participantDisconnected);

        room.on('participantConnected', participant => {
            console.log(`A remote Participant connected: ${participant}`);
        });
        updateParticipantCount();
        connected = true;
    }, error => {
        console.error(`Unable to connect to Room: ${error.message}`);
    });
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
    if (!screen) {
        screenshareOn.style.display = "block";
        screenshareOn.style.color = "#00cc00";
        screenshareOff.style.display = "none";

        let screenDiv = document.createElement('div');
        screenDiv.setAttribute('id', name + ' - screen');
        screenDiv.setAttribute('style', 'border-radius: 10px;border: 5px solid black;margin:40px;');
        //console.log(screenDiv);
        let tracksDiv = document.createElement('div');
        screenDiv.appendChild(tracksDiv);
        let labelDiv = document.createElement('div');
        labelDiv.setAttribute('class', 'mt-auto text-white-50');
        labelDiv.innerHTML = name + ' - screen';
        screenDiv.appendChild(labelDiv);
        container.appendChild(screenDiv);

        navigator.mediaDevices.getDisplayMedia().then(stream => {
            screenTrack = new Twilio.Video.LocalVideoTrack(stream.getTracks()[0]);
            room.localParticipant.publishTrack(screenTrack);
            screenTrack.mediaStreamTrack.onended = () => {
                shareScreenHandler()
            };

            /*let video = document.getElementById("local").firstElementChild;
            video.appendChild(screenTrack.attach());*/

            let video = document.getElementById(name + ' - screen').firstElementChild;
            video.appendChild(screenTrack.attach());

            /* let screenDiv = container.createElement('div');
            screenDiv.setAttribute('id', name + ' - screen');
            screenDiv.setAttribute('style', 'border-radius: 10px;border: 5px solid black;margin:40px;');
            screenDiv.createElement('div').appendChild(screenTrack.attach) */

            //console.log(screenTrack);
            //shareScreen.innerHTML = 'Stop sharing';
            screen = true;
        }).catch(() => {
            alert('Could not share the screen.')
        });
    } else {
        screenshareOff.style.display = "block";
        screenshareOff.style.color = "#cc0000";
        screenshareOn.style.display = "none";
        document.getElementById(name + ' - screen').remove();
        room.localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        screenTrack = null;
        screen = false;
    }
};