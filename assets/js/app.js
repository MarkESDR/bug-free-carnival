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

// Connect to call channel
let channel = socket.channel("call", {})
channel.join()
  .receive("ok", () => console.log("Successfully joined call channel"))
  .receive("error", () => console.log("Unable to join"))

// Setup buttons
let localStream, peerConnection
let localVideo = document.getElementById("localVideo")
let remoteVideo = document.getElementById("removeVideo")
let connectButton = document.getElementById("connect")
let callButton = document.getElementById("call")
let hangupButton = document.getElementById("hangup")

hangupButton.disabled = true
callButton.disabled = true
connectButton.onclick = connect
callButton.onclick = call
hangupButton.onclick = hangup

function connect() {
  console.log("Requesting local stream")
  navigator.mediaDevices.getUserMedia({audio: true, video: true})
    .then(gotStream)
    .catch(error => console.log("getUserMedia error: ", error))
}

function gotStream(stream) {
  console.log("Received local stream: ")
  localVideo.srcObject = stream
  localStream = stream
  setupPeerConnection()
}

function setupPeerConnection() {
  connectButton.disabled = true
  callButton.disabled = false
  hangupButton.disabled = false
  console.log("Waiting for call")

  let servers = {
    iceServers: [{
      url: "stun:stun.example.org"
    }]
  }

  peerConnection = new RTCPeerConnection(servers)
  console.log("Created local peer connection")
  peerConnection.onicecandidate = gotLocalCandidate
  peerConnection.onaddstream = gotRemoteStream
  peerConnection.addStream(localStream)
  console.log("Added localStream to localPeerConnection")
}

function call() {
  callButton.disabled = true
  console.log("Starting call")
  peerConnection.createOffer()
    .then(gotLocalDescription)
    .catch(handleError)
}

function gotLocalDescription(description) {
  peerConnection.setLocalDescription(description)
    .then(() => {
      channel.push("message", { body: JSON.stringify({
        sdp: peerConnection.localDescription
      })})
    })
    .catch(handleError)
  console.log("Offer from localPeerConnection: \n", description.sdp)
}

function gotRemoteDescription(description) {
  console.log("Answer from remotePeerConnection: \n", description.sdp)
  peerConnection.setRemoteDescription(description)
  peerConnection.createAnswer().then(gotLocalDescription).catch(handleError)
}

function gotRemoteStream(stream) {
  remoteVideo.srcObject = stream
  console.log("Received remote stream")
}

function gotLocalIceCandidate(event) {
  if (event.candidate) {
    console.log("Local ICE candidate: \n", event.candidate.candidate)
    channel.push("message", {body: JSON.stringify({
      candidate: event.candidate
    })})
  }
}

function gotRemoteIceCandidate(event) {
  callButton.disabled = true
  if (event.candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(event.candidate))
    console.log("Remote ICE candidate: \n" + event.candidate.candidate)
  }
}

channel.on("message", payload => {
  let message = JSON.parse(payload.body)
  if (message.sdp) {
    gotRemoteDescription(message)
  } else {
    gotRemoteIceCandidate(message)
  }
})

function hangup() {
  console.log("Ending call")
  peerConnection.close()
  localVideo.srcObject = null
  peerConnection = null
  hangupButton.disabled = true
  connectButton.disabled = false
  callButton.disabled = true
}

function handleError(error) {
  console.log(error.name + ": " + error.message)
}
