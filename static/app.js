function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementById("localS").firstElementChild;
        video.appendChild(track.attach());

    });
};

addLocalVideo();