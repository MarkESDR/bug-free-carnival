// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
import css from "../css/app.css"

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import dependencies
//
import "phoenix_html"

// Import local files
import socket from "./socket"

let myName = new Date().getTime()
let users = new Map()

// Connect to call channel
let channel = socket.channel("call", { name: myName })
channel.join()
  .receive("ok", () => console.log("Successfully joined call channel"))
  .receive("error", () => console.log("Unable to join"))

// Setup buttons
let targetName
let localStream, peerConnection
let localVideo = document.getElementById("localVideo")
let remoteVideo = document.getElementById("remoteVideo")
let hangupButton = document.getElementById("hangup")

hangupButton.disabled = true
hangupButton.onclick = hangup

const servers = {
  iceServers: [{
    urls: ["stun:stun.example.org"]
  }]
}

const mediaConstraints = {
  audio: true,
  video: true
}

function hangup() {
  console.log("Hanging up")
  closeVideoCall()
}

channel.on("message", message => {
  console.log("Received message: " + message.type)

  switch(message.type) {
    case "video-offer":
      handleVideoOfferMessage(message)
      break
    case "video-answer":
      handleVideoAnswerMessage(message)
      break
    case "new-ice-candidate":
      handleNewICECandidateMsg(message)
      break
    default:
      break
  }
})

channel.on("new_user", payload => {
  if (payload.name != myName) {
    console.log("New user: ", payload)
    users.set(payload.name, payload)
    channel.push("prev_user", { name: myName, target: payload.name })
    updateUserList()
  }
})

channel.on("prev_user", payload => {
  if (payload.target == myName) {
    let sender = { name: payload.name }
    console.log("Prev user: ", sender)
    users.set(sender.name, sender)
    updateUserList()
  }
})

channel.on("left_user", payload => {
  console.log("User left: ", payload)
  users.delete(payload.name)
  updateUserList()
})

function updateUserList() {
  let list = document.querySelector("ul#userlist")

  while (list.firstChild) {
    list.removeChild(list.firstChild)
  }

  users.forEach(user => {
    let item = document.createElement("li")
    let button = document.createElement("button")
    button.innerText = "Call"
    let callback = e => {
      targetName = user.name
      call(e)
    }
    button.addEventListener("click", callback, false)

    item.appendChild(document.createTextNode(user.name))
    item.appendChild(button)

    list.appendChild(item)
  })
}

function call(e) {
  if (peerConnection) {
    alert("Can't have more than one call man")
    return
  }

  console.log("Calling: ", targetName)
  createPeerConnection()

  navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then(localStream => {
      localVideo.srcObject = localStream
      localStream.getTracks().forEach(track => 
        peerConnection.addTrack(track, localStream)
      )
    })
    .catch(handleError)
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(servers)

  peerConnection.onicecandidate = handleICECandidateEvent
  peerConnection.ontrack = handleTrackEvent
  peerConnection.onnegotiationneeded = handleNegotiationNeededEvent
  peerConnection.onremovetrack = handleRemoveTrackEvent
  peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent
  peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent
  peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent
}


// Local-Remote handshake


function handleNegotiationNeededEvent() {
  peerConnection.createOffer()
    .then(offer => {
      return peerConnection.setLocalDescription(offer)
    })
    .then(() => {
      channel.push("message", {
        name: myName,
        target: targetName,
        type: "video-offer",
        sdp: peerConnection.localDescription
      })
    })
    .catch(handleError)
}

function handleVideoOfferMessage(msg) {
  targetName = msg.name

  createPeerConnection()

  peerConnection.setRemoteDescription(msg.sdp)
    .then(() => navigator.mediaDevices.getUserMedia(mediaConstraints))
    .then(stream => {
      localStream = stream
      localVideo.srcObject = localStream

      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })
    })
    .then(() => peerConnection.createAnswer())
    .then(answer => peerConnection.setLocalDescription(answer))
    .then(() => {
      channel.push("message", {
        name: myName,
        target: targetName,
        type: "video-answer",
        sdp: peerConnection.localDescription
      })
    })
    .catch(handleError)
}

function handleVideoAnswerMessage(msg) {
  peerConnection.setRemoteDescription(msg.sdp)
}


// Stream Handling


function handleTrackEvent(event) {
  remoteVideo.srcObject = event.streams[0]
  hangupButton.disabled = false
}

function handleRemoveTrackEvent(event) {
  let stream = remoteVideo.srcObject

  if (stream.getTracks().length = 0) {
    closeVideoCall()
  }
}


// ICE candidates


function handleICECandidateEvent(event) {
  if (event.candidate) {
    channel.push("message", {
      name: myName,
      target: targetName,
      type: "new-ice-candidate",
      candidate: event.candidate
    })
  }
}

function handleNewICECandidateMsg(msg) {
  peerConnection.addIceCandidate(msg.candidate)
    .catch(handleError)
}


// ICE state changes


function handleICEConnectionStateChangeEvent(event) {
  let state = peerConnection.iceConnectionState
  console.log("ICE Connection State Change: " + state)
  switch (state) {
    case "closed":
    case "failed":
    case "disconnected":
      closeVideoCall()
      break
    default:
      break
  }
}

function handleICEGatheringStateChangeEvent(event) {
  console.log("ICE Gathering State Change: " + peerConnection.iceGatheringState)
}

function handleSignalingStateChangeEvent(event) {
  console.log("Signaling State Change: " + peerConnection.signalingState)
}


// Close Video Call


function closeVideoCall() {
  if (peerConnection) {
    peerConnection.ontrack = null
    peerConnection.onremovetrack = null
    peerConnection.onremovestream = null
    peerConnection.onicecandidate = null
    peerConnection.oniceconnectionstatechange = null
    peerConnection.onsignalingstatechange = null
    peerConnection.onicegatheringstatechange = null
    peerConnection.onnegotiationneeded = null

    if (remoteVideo.srcObject) {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop())
    }

    if (localVideo.srcObject) {
      localVideo.srcObject.getTracks().forEach(track => track.stop())
    }

    peerConnection.close()
    peerConnection = null
  }

  remoteVideo.removeAttribute("src")
  remoteVideo.removeAttribute("srcObject")
  localVideo.removeAttribute("src")
  localVideo.removeAttribute("srcObject")

  hangupButton.disabled = true
  targetName = null
}


// Error handler


function handleError(error) {
  console.log(error.name + ": " + error.message)
}
