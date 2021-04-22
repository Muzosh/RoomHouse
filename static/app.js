let localRoom;
const participantCount = document.getElementById('participantsCount')
const inviteLink = document.getElementById('inviteLink')
const containerRow = document.getElementById('containerRow');
const screenShareContainerRow = document.getElementById('screenShareContainerRow')
const cameraOn = document.getElementById("camera-on");
const cameraOff = document.getElementById("camera-off");
const microphoneOn = document.getElementById("microphone-on");
const microphoneOff = document.getElementById("microphone-off");
const screenshareOn = document.getElementById("screenshare-on");
const screenshareOff = document.getElementById("screenshare-off");
let connected = false;
let screen = false;
let screenTrack;
let mute = true;
let video = true;

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

    inviteLink.innerHTML = window.location.href.replace("room", "joinroom")
}

function cameraOnHandler() {
    //zapatie kamery
    cameraOn.style.display = "block";
    cameraOn.style.color = "#00cc00";
    cameraOff.style.display = "none";
    muteOrUnmuteYourMedia(localRoom, 'video', 'unmute')
    //console.log("zapal si kameru");
}

function cameraOffHandler() {
    //vypnutie kamery
    cameraOff.style.display = "block";
    cameraOff.style.color = "#cc0000";
    cameraOn.style.display = "none";
    //console.log("vypal si kameru");
    muteOrUnmuteYourMedia(localRoom, 'video', 'mute')
}

function microphoneOnHandler() {
    //zapatie mic
    microphoneOn.style.display = "block";
    microphoneOn.style.color = "#00cc00";
    microphoneOff.style.display = "none";
    //console.log("zapal si mic");
    //audioMuteHandler();
    muteOrUnmuteYourMedia(localRoom, 'audio', 'unmute')
}

function microphoneOffHandler() {
    //vypatie mic
    microphoneOff.style.display = "block";
    microphoneOff.style.color = "#cc0000";
    microphoneOn.style.display = "none";
    //console.log("vypal si mic");
    //audioMuteHandler();
    muteOrUnmuteYourMedia(localRoom, 'audio', 'mute')
}

function muteOrUnmuteYourMedia(room, kind, action) {
    const publications = kind === 'audio' ? room.localParticipant.audioTracks : room.localParticipant.videoTracks;

    publications.forEach(publication => {
        if (action === 'mute') {
            if (!publication.track.name.includes('screen'))
            {
                publication.track.disable();
            }
        } else {
            publication.track.enable();
        }
    });
}

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack({
        width: 320,
        height: 240,
        resizeMode: "crop-and-scale"
    }).then(track => {
        let video = document.getElementById("local").firstElementChild;
        var trackElement = track.attach();
        //trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
        video.appendChild(trackElement);
    });
};

function connect(token, roomId) {
    Twilio.Video.createLocalTracks({
        audio: true,
        video: {
            width: 320,
            height: 240,
            resizeMode: "crop-and-scale"
        }
    }).then(localTracks => {
        return Twilio.Video.connect(token, {
            name: roomId,
            tracks: localTracks,
            automaticSubscription: true,
            bandwidthProfile: {
                video: {
                    mode: 'grid',
                    maxTracks: 0,
                    renderDimensions: {
                        high: {
                            height: 1080,
                            width: 1920
                        },
                        standard: {
                            height: 720,
                            width: 1280
                        },
                        low: {
                            height: 176,
                            width: 144
                        }
                    }
                }
            },
            maxAudioBitrate: 16000, //For music remove this line
            //For multiparty rooms (participants>=3) uncomment the line below
            preferredVideoCodecs: [{
                codec: 'VP8',
                simulcast: true
            }],
            networkQuality: {
                local: 1,
                remote: 1
            }
        });
    }).then(room => {
        localRoom = room
        console.log('Successfully joined a Room: ', room.name);

        room.participants.forEach(participantConnected);

        room.on('participantConnected', participantConnected);
        room.on('participantDisconnected', participantDisconnected);
        connected = true;
        updateParticipantCount();
    }, error => {
        console.error("Unable to connect to Room: ", error.message);
    });
};

function updateParticipantCount() {
    if (!connected) {
        console.log = 'Disconnected.';
        participantCount.innerHTML = 'You seem to be disconnected.';
    } else {
        participantCount.innerHTML = (localRoom.participants.size + 1) + ' participant(s) online.';
    }
};

function participantConnected(participant) {
    participant.on('trackSubscribed', track => trackSubscribed(track, participant));
    participant.on('trackUnsubscribed', track => trackUnsubscribed(track, participant));
    updateParticipantCount();
};

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    if (document.getElementById(participant.sid + "_screen") != null) {
        document.getElementById(participant.sid + "_screen").remove()
    }
    updateParticipantCount();
};

function trackSubscribed(track, participant) {
    if (!track.name.includes("screen")) {
        let participantDiv = document.getElementById(participant.sid)
        if (participantDiv == null) {
            participantDiv = document.createElement('div')
            participantDiv.setAttribute('class', 'col-2')
            participantDiv.setAttribute('id', participant.sid);
            participantDiv.setAttribute('style', 'width: auto; height: auto; border-radius: 10px;border: 5px solid black;margin:20px;');

            let tracksDiv = document.createElement('div');
            participantDiv.appendChild(tracksDiv);

            let avatar = document.createElement('img');
            avatar.src = "../static/avatar.jpg"
            avatar.width = 320
            avatar.height = 240
            participantDiv.appendChild(avatar);

            let labelDiv = document.createElement('div');
            labelDiv.innerHTML = participant.identity;
            participantDiv.appendChild(labelDiv);

            containerRow.appendChild(participantDiv);
        }
        var trackElement = track.attach();
        trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
        participantDiv.childNodes[0].appendChild(trackElement);

        if (track.kind == "audio") {
            if (!track.isEnabled) {
                participantDiv.childNodes[2].innerHTML = participant.identity + " (muted)"
            }

            track.on(
                'disabled',
                () => {
                    participantDiv.childNodes[2].innerHTML = participant.identity + " (muted)"
                });

            track.on(
                'enabled',
                () => {
                    participantDiv.childNodes[2].innerHTML = participant.identity
                });
        }

        if (track.kind == "video") {
            if (track.isEnabled) {
                participantDiv.childNodes[1].style.display = "none"
                participantDiv.childNodes[0].style.display = "block"
            } else {
                participantDiv.childNodes[1].style.display = "block"
                participantDiv.childNodes[0].style.display = "none"
            }

            track.on(
                'disabled',
                () => {
                    participantDiv.childNodes[1].style.display = "block"
                    participantDiv.childNodes[0].style.display = "none"
                });

            track.on(
                'enabled',
                () => {
                    participantDiv.childNodes[1].style.display = "none"
                    participantDiv.childNodes[0].style.display = "block"
                });
        }
    } else {
        let screenDiv = document.createElement('div');
        screenDiv.setAttribute('id', participant.sid + '_screen');
        screenDiv.setAttribute('class', 'col-12')
        screenDiv.setAttribute('style', 'width: auto; height: auto; border-radius: 10px;border: 5px solid black;margin:20px;');
        let tracksDiv = document.createElement('div');
        screenDiv.appendChild(tracksDiv);
        let labelDiv = document.createElement('div');
        labelDiv.innerHTML = participant.identity + ' - screen';
        screenDiv.appendChild(labelDiv);
        screenShareContainerRow.appendChild(screenDiv);
        var trackElement = track.attach();
        trackElement.addEventListener('click', () => { screenShareZoomTrack(trackElement); });
        screenDiv.childNodes[0].appendChild(trackElement);
        screenDiv.childNodes[0].childNodes[0].setAttribute("width", '100%')
        screenDiv.childNodes[0].childNodes[0].setAttribute("height", 'auto')

    }
};

function trackUnsubscribed(track, participant) {
    if (track.name.includes("screen")) {
        document.getElementById(participant.sid + "_screen").remove()
    } else {
        track.detach().forEach(element => element.remove());
    }

    updateParticipantCount();
};

function shareScreenHandler(name) {
    if (!screen) {
        screenshareOn.style.display = "none";
        screenshareOff.style.display = "block";
        screenshareOff.style.color = "#00cc00";

        let screenDiv = document.createElement('div');
        screenDiv.setAttribute('id', name + '_screen');
        screenDiv.setAttribute('class', 'col-12')
        screenDiv.setAttribute('style', 'width: auto; height: auto; border-radius: 10px;border: 5px solid black;margin:20px;');

        let tracksDiv = document.createElement('div');
        screenDiv.appendChild(tracksDiv);
        let labelDiv = document.createElement('div');
        labelDiv.innerHTML = name + ' - screen';
        screenDiv.appendChild(labelDiv);
        screenShareContainerRow.appendChild(screenDiv);

        navigator.mediaDevices.getDisplayMedia()
            .then(stream => {
                screenTrack = new Twilio.Video.LocalVideoTrack(
                    stream.getTracks()[0], {
                        name: name + '_screen'
                    });
                localRoom.localParticipant.publishTrack(screenTrack);

                let video = document.getElementById(name + '_screen').firstElementChild;
                var trackElement = screenTrack.attach();
                video.appendChild(trackElement);
                video.childNodes[0].setAttribute("width", '100%')
                video.childNodes[0].setAttribute("height", 'auto')

                screen = true;
            }).catch(() => {
                alert('Could not share the screen.')
                screenDiv.remove()
                screenshareOff.style.display = "none";
                screenshareOn.style.color = "white";
                screenshareOn.style.display = "block";
                screenTrack = null;
                screen = false;
            });
    } else {
        screenshareOff.style.display = "none";
        screenshareOn.style.color = "white";
        screenshareOn.style.display = "block";
        document.getElementById(name + '_screen').remove();
        localRoom.localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        screenTrack = null;
        screen = false;
    }
};

function zoomTrack(trackElement) {
    if (!trackElement.classList.contains('participantZoomed')) {
        // zoom in
        containerRow.childNodes.forEach(participant => {
            if (participant.className == 'col-2') {
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.add('participantZoomed')
                    }
                    else {
                        track.classList.add('participantHidden')
                    }
                });
                participant.childNodes[1].classList.add('participantHidden');
            }
        });
    }
    else {
        // zoom out
        containerRow.childNodes.forEach(participant => {
            if (participant.className == 'col-2') {
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.remove('participantZoomed');
                    }
                    else {
                        track.classList.remove('participantHidden');
                    }
                });
                participant.childNodes[1].classList.remove('participantHidden');
            }
        });
    }
};


function screenShareZoomTrack(trackElement) {
    if (!trackElement.classList.contains('participantZoomed')) {
        // zoom in
        screenShareContainerRow.childNodes.forEach(participant => {
            if (participant.className == 'col-12') {
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.add('participantZoomed')
                    }
                    else {
                        track.classList.add('participantHidden')
                    }
                });
                participant.childNodes[1].classList.add('participantHidden');
            }
        });
    }
    else {
        // zoom out
        screenShareContainerRow.childNodes.forEach(participant => {
            if (participant.className == 'col-12') {
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.remove('participantZoomed');
                    }
                    else {
                        track.classList.remove('participantHidden');
                    }
                });
                participant.childNodes[1].classList.remove('participantHidden');
            }
        });
    }
};
