function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementById('local').firstElementChild;
        video.appendChild(track.attach());
        
    });
};

addLocalVideo();