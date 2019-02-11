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

let name = new Date().getTime()
let users = []

// Connect to call channel
let channel = socket.channel("call", { name })
channel.join()
  .receive("ok", () => console.log("Successfully joined call channel"))
  .receive("error", () => console.log("Unable to join"))

// Setup buttons
let target
let localStream, peerConnection
let localVideo = document.getElementById("localVideo")
let remoteVideo = document.getElementById("remoteVideo")
let hangupButton = document.getElementById("hangup")

hangupButton.disabled = true
hangupButton.onclick = hangup

let servers = {
  iceServers: [{
    urls: ["stun:stun.example.org"]
  }]
}

function hangup() {
  console.log("Ending call")
  peerConnection.close()
  localVideo.srcObject = null
  peerConnection = null
  hangupButton.disabled = true
}

channel.on("message", payload => {
  let message = JSON.parse(payload.body)
  if (message.sdp) {
    gotRemoteDescription(message)
  } else {
    gotRemoteIceCandidate(message)
  }
})

channel.on("new_user", payload => {
  if (payload.name != name) {
    console.log("New user: ", payload)
    users.push(payload)
    channel.push("prev_user", { name, target: payload.name })
    updateUserList()
  }
})

channel.on("prev_user", payload => {
  if (payload.target == name) {
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

    item.appendChild(document.createTextNode(user.name))
    item.appendChild(button)

    list.appendChild(item)
  })
}

function handleError(error) {
  console.log(error.name + ": " + error.message)
}
