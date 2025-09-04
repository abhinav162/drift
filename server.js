const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const rooms = new Map();

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, 'public', filePath);
    
    const extname = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.joinedRooms = new Set(); // Track which rooms this client has joined
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'create_room':
                    const roomCode = generateRoomCode();
                    rooms.set(roomCode, {
                        code: roomCode,
                        clients: new Set(),
                        messages: []
                    });
                    
                    ws.send(JSON.stringify({
                        type: 'room_created',
                        roomCode: roomCode
                    }));
                    break;
                
                case 'join_room':
                    const { roomCode: joinRoomCode, nickname } = data;
                    
                    if (!rooms.has(joinRoomCode)) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Room not found'
                        }));
                        return;
                    }
                    
                    const room = rooms.get(joinRoomCode);
                    // Don't overwrite existing nickname and roomCode
                    if (!ws.nickname) {
                        ws.nickname = nickname;
                    }
                    ws.joinedRooms.add(joinRoomCode);
                    room.clients.add(ws);
                    
                    ws.send(JSON.stringify({
                        type: 'joined_room',
                        roomCode: joinRoomCode,
                        messages: room.messages
                    }));
                    
                    broadcastToRoom(joinRoomCode, {
                        type: 'user_joined',
                        nickname: nickname,
                        timestamp: Date.now()
                    }, ws);
                    break;
                
                case 'send_message':
                    const { roomCode: messageRoomCode, message: messageText } = data;
                    
                    if (!messageRoomCode || !rooms.has(messageRoomCode)) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Room not found'
                        }));
                        return;
                    }
                    
                    // Check if client is actually in this room
                    if (!ws.joinedRooms.has(messageRoomCode)) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Not in this room'
                        }));
                        return;
                    }
                    
                    const messageData = {
                        type: 'message',
                        nickname: ws.nickname,
                        message: messageText,
                        roomCode: messageRoomCode,
                        timestamp: Date.now()
                    };
                    
                    const currentRoom = rooms.get(messageRoomCode);
                    currentRoom.messages.push(messageData);
                    
                    broadcastToRoom(messageRoomCode, messageData);
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        
        // Clean up from all joined rooms
        if (ws.joinedRooms) {
            ws.joinedRooms.forEach(roomCode => {
                if (rooms.has(roomCode)) {
                    const room = rooms.get(roomCode);
                    room.clients.delete(ws);
                    
                    if (ws.nickname) {
                        broadcastToRoom(roomCode, {
                            type: 'user_left',
                            nickname: ws.nickname,
                            timestamp: Date.now()
                        }, ws);
                    }
                    
                    if (room.clients.size === 0) {
                        rooms.delete(roomCode);
                        console.log(`Room ${roomCode} deleted - no clients remaining`);
                    }
                }
            });
        }
    });
});

function broadcastToRoom(roomCode, message, excludeClient = null) {
    if (!rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    const messageStr = JSON.stringify(message);
    
    room.clients.forEach(client => {
        if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

server.listen(PORT, () => {
    console.log(`Chat server running on http://localhost:${PORT}`);
});