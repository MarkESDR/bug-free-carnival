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
let users = []

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
  console.log("Ending call")
  peerConnection.close()
  localVideo.srcObject = null
  peerConnection = null
  hangupButton.disabled = true
}

channel.on("message", message => {
  console.log("Received message: ", message)

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
    users.push(payload)
    channel.push("prev_user", { name: myName, target: payload.name })
    updateUserList()
  }
})

channel.on("prev_user", payload => {
  if (payload.target == myName) {
    let sender = { name: payload.name }
    console.log("Prev user: ", sender)
    users.push(sender)
    updateUserList()
  }
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
  //peerConnection.onremovetrack = handleRemoveTrackEvent
  //peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent
  //peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent
  //peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent
}

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

function handleTrackEvent(event) {
  console.log("Handling track event", event)
  remoteVideo.srcObject = event.streams[0]
  console.log(remoteVideo)
  hangupButton.disabled = false
}

function handleError(error) {
  console.log(error.name + ": " + error.message)
}
