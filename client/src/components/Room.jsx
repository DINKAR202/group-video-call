import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:5000");

const Room = () => {
  const { roomId } = useParams();
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("✅ Got stream:", stream);
        setStream(stream);
        if (userVideo.current) userVideo.current.srcObject = stream;

        socket.emit("join-room", roomId);

        socket.on("all-users", (users) => {
          console.log("📥 Users in room:", users);
          const tempPeers = [];
          users.forEach((userID) => {
            const peer = createPeer(userID, socket.id, stream);
            peersRef.current.push({ peerID: userID, peer });
            tempPeers.push({ peerID: userID, peer });
          });
          setPeers(tempPeers);
        });

        socket.on("user-joined", (payload) => {
          const { signal, callerID } = payload;
          const existingPeer = peersRef.current.find(
            (p) => p.peerID === callerID
          );
          if (!existingPeer) {
            const peer = addPeer(signal, callerID, stream);
            peersRef.current.push({ peerID: callerID, peer });
            setPeers((users) => [...users, { peerID: callerID, peer }]);
          }
        });

        socket.on("receiving-returned-signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          if (item) {
            item.peer.signal(payload.signal);
          }
        });
      });

    return () => {
      socket.disconnect();
    };
  }, []);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Room ID: {roomId}</h2>
      <div className="grid grid-cols-2 gap-4">
        <video
          ref={userVideo}
          autoPlay
          playsInline
          muted
          className="w-full border rounded"
        />
        {peers.map((peerObj) => (
          <Video key={peerObj.peerID} peer={peerObj.peer} />
        ))}
      </div>
    </div>
  );
};

const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <video ref={ref} autoPlay playsInline className="w-full border rounded" />
  );
};

export default Room;
