
let room;

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack({width: 400,height:300}).then(track => {
        let video = document.getElementById("local").firstElementChild;
        video.appendChild(track.attach());
    });
};

function connect(token) {
console.log("Connectni se petaneeeee")
/*
    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        fetch('/room/<id>', {
            method: 'POST',
            body: JSON.stringify({'username': username})
        }).then(res => res.json()).then(data => {
            // join video call
            return Twilio.Video.connect(data.token);
        }).catch(() => {
            reject();
        });
    });
    return promise;*/
    console.log(token)
    return Twilio.Video.connect(token);
};

function connectButtonHandler(event) {
    console.log("Petaneee")
};
