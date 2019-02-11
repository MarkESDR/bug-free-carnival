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
let remoteVideo = document.getElementById("remoteVideo")
let connectButton = document.getElementById("connect")
let callButton = document.getElementById("call")
let hangupButton = document.getElementById("hangup")

hangupButton.disabled = true
callButton.disabled = true
connectButton.onclick = connect
callButton.onclick = call
hangupButton.onclick = hangup

let servers = {
  iceServers: [{
    urls: ["stun:stun.example.org"]
  }]
}

function connect() {
}

function call() {
}

function hangup() {
  console.log("Ending call")
  peerConnection.close()
  localVideo.srcObject = null
  peerConnection = null
  hangupButton.disabled = true
  connectButton.disabled = false
  callButton.disabled = true
}

channel.on("message", payload => {
  let message = JSON.parse(payload.body)
  if (message.sdp) {
    gotRemoteDescription(message)
  } else {
    gotRemoteIceCandidate(message)
  }
})

function handleError(error) {
  console.log(error.name + ": " + error.message)
}
