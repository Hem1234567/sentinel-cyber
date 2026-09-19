# Sentinel - Real-Time API Monitoring & Incident Detection Platform

## High-Level Vision
A developer-focused API observability and security platform designed to provide real-time insights into API performance, security threats, and system incidents.

## Core Capabilities
- **Asynchronous Non-Blocking SDK Middleware:** Minimal performance overhead for monitored applications.
- **Real-Time Alert Rule Engine:** Instant detection of SQLi, XSS, Latency spikes, and Rate-limit breaches.
- **WebSocket Dashboard Stream:** Live updating UI for monitoring API traffic and incidents as they happen.

## Tech Stack
- **Backend Environment:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Frontend Framework:** import React from 'react';
import useTelemetryStore from '../store/telemetryStore';

const Dashboard = () => {
  const telemetry = useTelemetryStore((state) => state.telemetry);

  return (
    <div>
      <h1>Telemetry Dashboard</h1>
      <ul>
        {telemetry.map((telem) => (
          <li key={telem.id}>{JSON.stringify(telem)}</li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;import create from 'zustand';

const useTelemetryStore = create((set) => ({
  telemetry: [],
  addTelemetry: (telemetry) => {
    set((state) => {
      // Check if the telemetry already exists
      const existingTelemetryIndex = state.telemetry.findIndex(
        (t) => t.id === telemetry.id
      );
      if (existingTelemetryIndex === -1) {
        // Add new telemetry
        return { telemetry: [...state.telemetry, telemetry] };
      }
      return state;
    });
  }
}));

export default useTelemetryStore;import { io } from 'socket.io-client';

const socket = io('http://localhost:3000'); // Ensure this URL is correct

socket.on('new-telemetry', (telemetry) => {
  console.log('New telemetry received:', telemetry);
  // Forward the telemetry to the Zustand store
  addTelemetry(telemetry);
});

export default socket;const io = require('socket.io')(server, {
  cors: {
    origin: 'http://127.0.0.1:5173',
    methods: ['GET', 'POST']
  }
});React (Vite)
- **State Management:** Zustand
- **Real-Time Communication:** Socket.io
- **Styling:** Tailwind CSS
