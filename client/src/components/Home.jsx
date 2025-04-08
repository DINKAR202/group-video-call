import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomIdInput, setRoomIdInput] = useState("");
  const navigate = useNavigate();

  const handleCreate = () => {
    const id = Math.random().toString(36).substring(2, 10);
    navigate(`/room/${id}`);
  };

  const handleJoin = () => {
    if (roomIdInput) {
      navigate(`/room/${roomIdInput}`);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4 items-center">
      <h1 className="text-3xl font-bold">Welcome to VideoMeet</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleCreate}
      >
        Create a Meeting
      </button>
      <div className="flex gap-2">
        <input
          className="border px-2 py-1"
          placeholder="Enter Room ID"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
        />
        <button
          className="bg-green-600 text-white px-4 py-1 rounded"
          onClick={handleJoin}
        >
          Join
        </button>
      </div>
    </div>
  );
}

export default Home;
