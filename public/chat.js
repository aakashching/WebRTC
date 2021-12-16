var socket = io.connect("http://localhost:3000");
var chatLobby = document.getElementById("chat-app");
var chatRooom = document.getElementById("video-chat-room");
var roomName = document.getElementById("roomName");
var joinBtn = document.getElementById("join");
var usrvdo = document.getElementById("user-video");
var peervdo = document.getElementById("peer-video");
var creator;
var room = roomName.value;
var rtcPeerConnection;
var userStream;
var config = {
  iceServers: [
    {
      urls: "stun:stun.services.mozilla.com",
    },
    {
      urls: "stun:stun4.l.google.com:19302",
    },
  ],
};

joinBtn.addEventListener("click", () => {
  if (roomName.value.trim().length === 0) {
    alert("please inter valid room name");
  } else {
    socket.emit("join", roomName.value);
  }
  console.log("joining..");
  return;
});

socket.on("created", function () {
  console.log("room created");
  creator = true;

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: { width: 480, height: 360 } })
    .then((stream) => {
      userStream = stream;
      chatLobby.style = "display:none;";
      usrvdo.srcObject = stream;
      usrvdo.onloadedmetadata = function (e) {
        usrvdo.muted = true;
        usrvdo.play();
      };
      socket.emit("ready", roomName.value);
    })
    .catch((err) => {
      alert("can't get user media");
    });
});
socket.on("joined", () => {
  console.log("room joined");

  creator = false;
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: { width: 480, height: 360 } })
    .then((stream) => {
      userStream = stream;
      // socket.emit("join", roomName.value);
      chatLobby.style = "display:none;";
      usrvdo.srcObject = stream;
      usrvdo.onloadedmetadata = function (e) {
        usrvdo.muted = true;
        usrvdo.play();
      };
      socket.emit("ready", roomName.value);
    })
    .catch((err) => {
      alert("can't get user media");
    });
});
socket.on("full", () => {
  alert("Room is full, Can't Join");
});
socket.on("ready", () => {
  console.log("ready to connect");
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(config);
    console.log(rtcPeerConnection);
    rtcPeerConnection.onicecandidate = rtcIceCandidate;
    rtcPeerConnection.ontrack = onTrack;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName.value);
      })

      .catch((error) => {
        console.log(error);
      });
  }
});
socket.on("candidate", (candidate) => {
  if (candidate) {
    console.log(candidate);
    let icecandidate = new RTCIceCandidate({
      candidate: candidate?.candidate,
      sdpMid: candidate?.sdpMid,
      sdpMLineIndex: candidate?.sdpMLineIndex,
    });
    console.log(icecandidate);
    rtcPeerConnection.addIceCandidate(icecandidate);
  }
});
socket.on("offer", (offer) => {
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(config);
    console.log(rtcPeerConnection);
    rtcPeerConnection.onicecandidate = rtcIceCandidate;
    rtcPeerConnection.ontrack = onTrack;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection.createAnswer(
      (answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomName.value);
      },
      (err) => {
        console.log(err);
      }
    );
  }
});
socket.on("answer", (answer) => {
  rtcPeerConnection.setRemoteDescription(answer);
});

function rtcIceCandidate(event) {
  console.log("candidate is on");
  console.log(event);
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName.value);
  }
}
function onTrack(event) {
  console.log("track event");
  console.log(event);
  peervdo.srcObject = event.streams[0];
  peervdo.onloadedmetadata = function (e) {
    peervdo.play();
  };
}
