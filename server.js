const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const rooms = new Map();

// ── Snake game constants ────────────────────────────────────────────────────
const SNAKE_MAP_WIDTH  = 50;
const SNAKE_MAP_HEIGHT = 20;
const SNAKE_TICK_MS    = 160;
const SNAKE_MIN_PLAYERS = 2;
const SNAKE_MAX_PLAYERS = 6;
const SNAKE_COUNTDOWN   = 3;

const SNAKE_START_POSITIONS = [
    { x:  5, y:  5, dir: 'right' },
    { x: 44, y: 14, dir: 'left'  },
    { x:  5, y: 14, dir: 'right' },
    { x: 44, y:  5, dir: 'left'  },
    { x: 25, y:  2, dir: 'down'  },
    { x: 25, y: 17, dir: 'up'    },
];

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── Snake helpers ───────────────────────────────────────────────────────────
function spawnFood(game) {
    const occupied = new Set();
    game.players.forEach(p => p.snake.forEach(s => occupied.add(`${s.x},${s.y}`)));
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * SNAKE_MAP_WIDTH),
            y: Math.floor(Math.random() * SNAKE_MAP_HEIGHT)
        };
    } while (occupied.has(`${pos.x},${pos.y}`));
    return pos;
}

function broadcastSnakeState(roomCode) {
    if (!rooms.has(roomCode)) return;
    const game = rooms.get(roomCode).snakeGame;
    if (!game) return;
    const players = Array.from(game.players.values()).map(p => ({
        nickname: p.nickname,
        snake:    p.snake,
        score:    p.score,
        alive:    p.alive,
        styleIndex: p.styleIndex,
        direction:  p.direction,
        rank:       p.rank || null,
    }));
    broadcastToRoom(roomCode, {
        type: 'snake_state',
        players,
        food: game.food,
        alivePlayers: players.filter(p => p.alive).length,
    });
}

function initSnakeGame(roomCode) {
    const game = rooms.get(roomCode).snakeGame;
    let idx = 0;
    game.players.forEach(player => {
        const sp = SNAKE_START_POSITIONS[idx % SNAKE_START_POSITIONS.length];
        const dx = sp.dir === 'right' ? -1 : sp.dir === 'left' ?  1 : 0;
        const dy = sp.dir === 'down'  ? -1 : sp.dir === 'up'   ?  1 : 0;
        player.styleIndex    = idx;
        player.direction     = sp.dir;
        player.nextDirection = sp.dir;
        player.alive  = true;
        player.score  = 0;
        player.rank   = null;
        player.snake  = [
            { x: sp.x,          y: sp.y          },
            { x: sp.x + dx,     y: sp.y + dy     },
            { x: sp.x + dx * 2, y: sp.y + dy * 2 },
        ];
        idx++;
    });
    game.food        = spawnFood(game);
    game.finishOrder = [];
    game.tickCount   = 0;
}

function endSnakeGame(roomCode) {
    if (!rooms.has(roomCode)) return;
    const game = rooms.get(roomCode).snakeGame;
    if (!game) return;
    if (game.gameLoop) { clearInterval(game.gameLoop); game.gameLoop = null; }
    game.state = 'gameover';

    const players = Array.from(game.players.values());
    // Assign rank 1 to last survivor if any
    const survivors = players.filter(p => p.alive);
    if (survivors.length === 1) survivors[0].rank = 1;

    const scoreboard = players
        .sort((a, b) => (a.rank || 999) - (b.rank || 999))
        .map(p => ({ nickname: p.nickname, score: p.score, rank: p.rank || players.length }));

    broadcastToRoom(roomCode, { type: 'snake_game_over', scoreboard });
}

function doSnakeRestart(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const game = room.snakeGame;
    if (game.gameLoop) { clearInterval(game.gameLoop); game.gameLoop = null; }

    // Rebuild players from still-connected clients only
    const oldData = new Map(game.players);
    game.players = new Map();
    room.clients.forEach(client => {
        if (oldData.has(client)) {
            game.players.set(client, {
                nickname: oldData.get(client).nickname,
                snake: [], direction: 'right', nextDirection: 'right',
                score: 0, alive: true, styleIndex: 0, rank: null,
            });
        }
    });

    game.restartVotes = new Set();
    game.state = 'countdown';
    const nicks = Array.from(game.players.values()).map(p => p.nickname);
    broadcastToRoom(roomCode, { type: 'snake_restarting', players: nicks });

    let count = SNAKE_COUNTDOWN;
    broadcastToRoom(roomCode, { type: 'snake_countdown', count });
    const cdInterval = setInterval(() => {
        count--;
        broadcastToRoom(roomCode, { type: 'snake_countdown', count });
        if (count <= 0) {
            clearInterval(cdInterval);
            initSnakeGame(roomCode);
            rooms.get(roomCode).snakeGame.state = 'playing';
            rooms.get(roomCode).snakeGame.gameLoop = setInterval(
                () => tickSnakeGame(roomCode), SNAKE_TICK_MS
            );
            broadcastSnakeState(roomCode);
        }
    }, 1000);
}

function tickSnakeGame(roomCode) {
    if (!rooms.has(roomCode)) return;
    const game = rooms.get(roomCode).snakeGame;
    if (!game || game.state !== 'playing') return;

    const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
    const alive = Array.from(game.players.values()).filter(p => p.alive);

    // Resolve queued directions and compute new heads
    const newHeads = new Map();
    alive.forEach(player => {
        if (player.nextDirection !== OPPOSITE[player.direction])
            player.direction = player.nextDirection;
        const h = player.snake[0];
        let nx = h.x, ny = h.y;
        if (player.direction === 'up')    ny--;
        if (player.direction === 'down')  ny++;
        if (player.direction === 'left')  nx--;
        if (player.direction === 'right') nx++;
        newHeads.set(player, { x: nx, y: ny });
    });

    // Wall collision
    alive.forEach(player => {
        const nh = newHeads.get(player);
        if (nh.x < 0 || nh.x >= SNAKE_MAP_WIDTH || nh.y < 0 || nh.y >= SNAKE_MAP_HEIGHT)
            player.alive = false;
    });

    // Move snakes, check food
    let foodEaten = false;
    alive.filter(p => p.alive).forEach(player => {
        const nh = newHeads.get(player);
        const ate = game.food && nh.x === game.food.x && nh.y === game.food.y;
        player.snake.unshift(nh);
        if (ate) { player.score++; foodEaten = true; }
        else      { player.snake.pop(); }
    });

    if (foodEaten) game.food = spawnFood(game);

    // Self + other snake collisions (after all snakes moved)
    const allPlayers = Array.from(game.players.values());
    alive.filter(p => p.alive).forEach(player => {
        const head = player.snake[0];
        // Self
        for (let i = 1; i < player.snake.length; i++) {
            if (head.x === player.snake[i].x && head.y === player.snake[i].y) {
                player.alive = false; break;
            }
        }
        if (!player.alive) return;
        // Others
        allPlayers.forEach(other => {
            if (other === player) return;
            for (const seg of other.snake) {
                if (head.x === seg.x && head.y === seg.y) { player.alive = false; return; }
            }
        });
    });

    // Process newly dead
    const nowDead = alive.filter(p => !p.alive);
    nowDead.forEach(p => {
        if (!p.rank) {
            p.rank = allPlayers.length - game.finishOrder.length;
            game.finishOrder.push(p.nickname);
        }
        p.snake = []; // clear so it doesn't block others
        broadcastToRoom(roomCode, { type: 'snake_player_died', nickname: p.nickname });
    });

    // Win check
    const stillAlive = allPlayers.filter(p => p.alive);
    if (stillAlive.length <= 1) {
        broadcastSnakeState(roomCode);
        endSnakeGame(roomCode);
        return;
    }

    broadcastSnakeState(roomCode);
    game.tickCount++;
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
                case 'snake_create': {
                    const snakeCode = generateRoomCode();
                    const snakeNick = data.nickname;
                    rooms.set(snakeCode, {
                        code: snakeCode,
                        clients: new Set(),
                        messages: [],
                        snakeGame: {
                            state: 'waiting',
                            players: new Map(),
                            food: null,
                            gameLoop: null,
                            finishOrder: [],
                            tickCount: 0,
                            restartVotes: new Set(),
                        }
                    });
                    // Auto-join creator
                    const newRoom = rooms.get(snakeCode);
                    ws.nickname = snakeNick;
                    ws.joinedRooms.add(snakeCode);
                    newRoom.clients.add(ws);
                    newRoom.snakeGame.players.set(ws, {
                        nickname: snakeNick, snake: [], direction: 'right',
                        nextDirection: 'right', score: 0, alive: true,
                        styleIndex: 0, rank: null,
                    });
                    ws.send(JSON.stringify({
                        type: 'snake_room_joined',
                        roomCode: snakeCode,
                        playerCount: 1,
                        players: [snakeNick],
                    }));
                    break;
                }

                case 'snake_join_room': {
                    const { roomCode: sjCode, nickname: sjNick } = data;
                    if (!rooms.has(sjCode)) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Game room not found' }));
                        break;
                    }
                    const sjRoom = rooms.get(sjCode);
                    if (!sjRoom.snakeGame) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Not a snake game room' }));
                        break;
                    }
                    const sjGame = sjRoom.snakeGame;
                    if (sjGame.state !== 'waiting') {
                        ws.send(JSON.stringify({ type: 'error', message: 'Game already in progress' }));
                        break;
                    }
                    if (sjGame.players.size >= SNAKE_MAX_PLAYERS) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Room is full (max 6)' }));
                        break;
                    }
                    ws.nickname = sjNick;
                    ws.joinedRooms.add(sjCode);
                    sjRoom.clients.add(ws);
                    sjGame.players.set(ws, {
                        nickname: sjNick, snake: [], direction: 'right',
                        nextDirection: 'right', score: 0, alive: true,
                        styleIndex: sjGame.players.size, rank: null,
                    });
                    const sjCount   = sjGame.players.size;
                    const sjNicknames = Array.from(sjGame.players.values()).map(p => p.nickname);
                    ws.send(JSON.stringify({
                        type: 'snake_room_joined',
                        roomCode: sjCode,
                        playerCount: sjCount,
                        players: sjNicknames,
                    }));
                    broadcastToRoom(sjCode, {
                        type: 'snake_player_joined',
                        nickname: sjNick,
                        playerCount: sjCount,
                        players: sjNicknames,
                    }, ws);

                    if (sjCount >= SNAKE_MIN_PLAYERS && sjGame.state === 'waiting') {
                        sjGame.state = 'countdown';
                        let cdCount = SNAKE_COUNTDOWN;
                        broadcastToRoom(sjCode, { type: 'snake_countdown', count: cdCount });
                        const cdInterval = setInterval(() => {
                            cdCount--;
                            broadcastToRoom(sjCode, { type: 'snake_countdown', count: cdCount });
                            if (cdCount <= 0) {
                                clearInterval(cdInterval);
                                initSnakeGame(sjCode);
                                rooms.get(sjCode).snakeGame.state = 'playing';
                                rooms.get(sjCode).snakeGame.gameLoop = setInterval(
                                    () => tickSnakeGame(sjCode), SNAKE_TICK_MS
                                );
                                broadcastSnakeState(sjCode);
                            }
                        }, 1000);
                    }
                    break;
                }

                case 'snake_direction': {
                    const { roomCode: sdCode, direction: sdDir } = data;
                    if (!rooms.has(sdCode)) break;
                    const sdGame = rooms.get(sdCode).snakeGame;
                    if (!sdGame) break;
                    const sdPlayer = sdGame.players.get(ws);
                    if (sdPlayer && sdPlayer.alive) {
                        const OPP = { up:'down', down:'up', left:'right', right:'left' };
                        if (sdDir !== OPP[sdPlayer.direction]) sdPlayer.nextDirection = sdDir;
                    }
                    break;
                }

                case 'snake_vote_restart': {
                    const { roomCode: svCode } = data;
                    if (!rooms.has(svCode)) break;
                    const svGame = rooms.get(svCode).snakeGame;
                    if (!svGame || svGame.state !== 'gameover') break;

                    const voter = svGame.players.get(ws);
                    if (!voter) break;

                    svGame.restartVotes.add(ws);
                    const voteCount  = svGame.restartVotes.size;
                    const totalCount = svGame.players.size;

                    broadcastToRoom(svCode, {
                        type: 'snake_restart_vote',
                        nickname: voter.nickname,
                        votes: voteCount,
                        total: totalCount,
                    });

                    if (voteCount >= totalCount) {
                        doSnakeRestart(svCode);
                    }
                    break;
                }

                case 'snake_restart': {
                    const { roomCode: srCode } = data;
                    if (!rooms.has(srCode)) break;
                    const srGame = rooms.get(srCode).snakeGame;
                    if (!srGame || srGame.state !== 'gameover') break;
                    doSnakeRestart(srCode);
                    break;
                }

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

        if (ws.joinedRooms) {
            ws.joinedRooms.forEach(roomCode => {
                if (!rooms.has(roomCode)) return;
                const room = rooms.get(roomCode);
                room.clients.delete(ws);

                // Handle snake game disconnect
                if (room.snakeGame && room.snakeGame.players.has(ws)) {
                    const sg = room.snakeGame;
                    const sp = sg.players.get(ws);
                    if (sg.state === 'playing' && sp.alive) {
                        sp.alive = false;
                        sp.snake = [];
                        if (!sp.rank) {
                            sp.rank = Array.from(sg.players.values()).filter(p => p.alive).length + 1;
                            sg.finishOrder.push(sp.nickname);
                        }
                        broadcastToRoom(roomCode, { type: 'snake_player_died', nickname: sp.nickname });
                        const remaining = Array.from(sg.players.values()).filter(p => p.alive);
                        if (remaining.length <= 1) endSnakeGame(roomCode);
                    }
                    sg.players.delete(ws);
                }

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