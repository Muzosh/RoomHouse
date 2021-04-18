button.addEventListener('click', connectButtonHandler);
shareScreen.addEventListener('click', shareScreenHandler);
toggleChat.addEventListener('click', toggleChatHandler);
chatInput.addEventListener('keyup', onChatInputKey);
let connected = false;
let room;

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementById("local").firstElementChild;
        video.appendChild(track.attach());

    });
};

function connect(username) {
    /* let promise = new Promise((resolve, reject) => {
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
    return promise; */
    return Twilio.Video.connect(token.token);
};

function connectButtonHandler(event) {
    event.preventDefault();
    if (!connected) {
        let username = usernameInput.value;
        if (!username) {
            alert('Enter your name before connecting');
            return;
        }
        button.disabled = true;
        button.innerHTML = 'Connecting...';
        connect(username).then(() => {
            button.innerHTML = 'Leave call';
            button.disabled = false;
            shareScreen.disabled = false;
        }).catch(() => {
            alert('Connection failed. Is the backend running?');
            button.innerHTML = 'Join call';
            button.disabled = false;
        });
    }
    else {
        disconnect();
        button.innerHTML = 'Join call';
        connected = false;
        shareScreen.innerHTML = 'Share screen';
        shareScreen.disabled = true;
    }
};

addLocalVideo();