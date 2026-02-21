/**
 * WebRTC Signaling Server
 *
 * A lightweight WebSocket server that relays WebRTC signaling messages
 * (offer, answer, ICE candidates) between peers in the same room.
 *
 * Supports Chrome, Firefox, Opera, Edge, and Android browsers.
 * Platforms: Linux, Mac, Windows.
 */

const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8081;

// Map<roomId, Set<WebSocket>>
const rooms = new Map();

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
    let currentRoom = null;

    ws.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        } catch {
            return;
        }

        switch (msg.type) {
            case "join": {
                const { roomId } = msg;
                if (!roomId) return;

                currentRoom = roomId;

                if (!rooms.has(roomId)) {
                    rooms.set(roomId, new Set());
                }

                const room = rooms.get(roomId);
                room.add(ws);

                console.log(
                    `[Room ${roomId}] Peer joined. Total peers: ${room.size}`
                );

                // Only the NEW joiner should create the offer.
                // Tell the new joiner that a peer is already present (if any).
                if (room.size >= 2) {
                    ws.send(JSON.stringify({ type: "create-offer" }));
                    console.log(`[Room ${roomId}] Told new joiner to create offer`);
                }
                break;
            }

            case "offer":
            case "answer":
            case "ice-candidate": {
                // Relay to all other peers in the same room
                if (!currentRoom || !rooms.has(currentRoom)) return;
                const room = rooms.get(currentRoom);
                for (const peer of room) {
                    if (peer !== ws && peer.readyState === 1) {
                        peer.send(JSON.stringify(msg));
                    }
                }
                break;
            }

            case "hang-up": {
                if (!currentRoom || !rooms.has(currentRoom)) return;
                const room = rooms.get(currentRoom);
                for (const peer of room) {
                    if (peer !== ws && peer.readyState === 1) {
                        peer.send(JSON.stringify({ type: "peer-left" }));
                    }
                }
                break;
            }
        }
    });

    ws.on("close", () => {
        if (currentRoom && rooms.has(currentRoom)) {
            const room = rooms.get(currentRoom);
            room.delete(ws);

            // Notify remaining peers
            for (const peer of room) {
                if (peer.readyState === 1) {
                    peer.send(JSON.stringify({ type: "peer-left" }));
                }
            }

            if (room.size === 0) {
                rooms.delete(currentRoom);
            }

            console.log(
                `[Room ${currentRoom}] Peer left. Remaining: ${room.size}`
            );
        }
    });

    ws.on("error", (err) => {
        console.error("WebSocket error:", err.message);
    });
});

console.log(`✅ Signaling server running on ws://localhost:${PORT}`);
