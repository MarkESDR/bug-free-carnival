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
connectButton.onClick = connect
callButton.onClick = call
hangupButton.onClick = hangup

function connect() {
  console.log("Requesting local stream")
  navigator.getUserMedia({audio: true, video: true}, gotStream, error => {
    console.log("getUserMedia error: ", error)
  })
}
