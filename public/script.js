class MEMCPChat {
    constructor() {
        this.ws = null;
        this.currentRoom = null;
        this.nickname = null;
        this.rooms = new Map(); // Store room data
        this.cuteNames = [
            'FluffyPanda', 'BubbleBear', 'SparkleKitten', 'CozyCub', 'SnuggleBunny',
            'TwinkleFox', 'BouncyPuppy', 'SweetPeach', 'CloudyDream', 'StarryOwl',
            'HappyDolphin', 'GentleLamb', 'CheerfulBee', 'WarmHug', 'SilkyMouse',
            'GoldenSun', 'SoftFeather', 'JoyfulBird', 'CalmWave', 'BrightMoon',
            'PlayfulOtter', 'TenderRose', 'LightBreeze', 'CozyTiger', 'GlowWorm',
            'SunnyDaisy', 'MellowCat', 'DreamyCloud', 'GentleRain', 'WiseFrog'
        ];
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Welcome screen listeners
        document.getElementById('create-room').addEventListener('click', () => this.createRoom());
        document.getElementById('join-room').addEventListener('click', () => this.toggleJoinSection());
        document.getElementById('join-room-btn').addEventListener('click', () => this.joinRoom());
        
        // Main screen listeners
        document.getElementById('add-room').addEventListener('click', () => this.showRoomModal());
        document.getElementById('create-new-room').addEventListener('click', () => this.showRoomModal());
        document.getElementById('logout').addEventListener('click', () => this.logout());
        
        // Modal listeners
        document.getElementById('close-modal').addEventListener('click', () => this.hideRoomModal());
        document.getElementById('modal-create-room').addEventListener('click', () => this.createRoomFromModal());
        document.getElementById('modal-join-room').addEventListener('click', () => this.toggleModalJoinSection());
        document.getElementById('modal-join-btn').addEventListener('click', () => this.joinRoomFromModal());
        
        // Chat listeners
        document.getElementById('send-message').addEventListener('click', () => this.sendMessage());
        document.getElementById('share-room').addEventListener('click', () => this.shareRoom());
        document.getElementById('leave-room').addEventListener('click', () => this.leaveCurrentRoom());
        
        // Enter key listeners
        document.getElementById('message-text').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        document.getElementById('nickname').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createRoom();
        });
        
        document.getElementById('room-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
        
        document.getElementById('modal-room-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoomFromModal();
        });
        
        // Check URL params
        this.checkUrlParams();
    }
    
    generateCuteUsername() {
        return this.cuteNames[Math.floor(Math.random() * this.cuteNames.length)] + 
               Math.floor(Math.random() * 1000);
    }
    
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        if (roomCode) {
            // Auto-generate cute username and join directly
            this.nickname = this.generateCuteUsername();
            this.autoJoinRoom(roomCode.toUpperCase());
        }
    }
    
    async autoJoinRoom(roomCode) {
        try {
            await this.connectWebSocket();
            this.ws.send(JSON.stringify({
                type: 'join_room',
                roomCode: roomCode,
                nickname: this.nickname
            }));
            
            // Update URL without room param to prevent re-joining on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('Auto-join failed:', error);
            // Fall back to manual join
            document.getElementById('room-code').value = roomCode;
            document.getElementById('nickname').value = this.nickname;
            this.toggleJoinSection();
        }
    }
    
    connectWebSocket() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            this.ws = new WebSocket(`${protocol}//${window.location.host}`);
            
            this.ws.onopen = () => {
                console.log('Connected to server');
                resolve();
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('Disconnected from server');
                this.showNotification('Disconnected from server', 'error');
                // Don't automatically logout on disconnect
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.showNotification('Connection error', 'error');
                reject(error);
            };
        });
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'room_created':
                this.joinCreatedRoom(data.roomCode);
                break;
                
            case 'joined_room':
                this.handleRoomJoined(data);
                break;
                
            case 'message':
            case 'user_joined':
            case 'user_left':
                this.displayMessage(data);
                break;
                
            case 'error':
                this.showNotification(data.message, 'error');
                break;
        }
    }
    
    async createRoom() {
        const nicknameInput = document.getElementById('nickname');
        this.nickname = nicknameInput.value.trim();
        
        if (!this.nickname) {
            this.showNotification('Please enter a nickname', 'error');
            nicknameInput.focus();
            return;
        }
        
        try {
            await this.connectWebSocket();
            this.ws.send(JSON.stringify({
                type: 'create_room'
            }));
        } catch (error) {
            this.showNotification('Failed to connect to server', 'error');
        }
    }
    
    async createRoomFromModal() {
        try {
            await this.connectWebSocket();
            this.ws.send(JSON.stringify({
                type: 'create_room'
            }));
            this.hideRoomModal();
        } catch (error) {
            this.showNotification('Failed to connect to server', 'error');
        }
    }
    
    joinCreatedRoom(roomCode) {
        this.ws.send(JSON.stringify({
            type: 'join_room',
            roomCode: roomCode,
            nickname: this.nickname
        }));
    }
    
    toggleJoinSection() {
        const joinSection = document.getElementById('join-section');
        const nicknameInput = document.getElementById('nickname');
        
        if (!this.nickname) {
            this.nickname = nicknameInput.value.trim();
            if (!this.nickname) {
                this.showNotification('Please enter a nickname first', 'error');
                nicknameInput.focus();
                return;
            }
        }
        
        joinSection.classList.toggle('hidden');
        if (!joinSection.classList.contains('hidden')) {
            document.getElementById('room-code').focus();
        }
    }
    
    toggleModalJoinSection() {
        const joinSection = document.getElementById('modal-join-section');
        joinSection.classList.toggle('hidden');
        if (!joinSection.classList.contains('hidden')) {
            document.getElementById('modal-room-code').focus();
        }
    }
    
    async joinRoom() {
        const roomCodeInput = document.getElementById('room-code');
        const roomCode = roomCodeInput.value.trim().toUpperCase();
        
        if (!roomCode) {
            this.showNotification('Please enter a room code', 'error');
            roomCodeInput.focus();
            return;
        }
        
        if (!this.nickname) {
            const nicknameInput = document.getElementById('nickname');
            this.nickname = nicknameInput.value.trim();
            if (!this.nickname) {
                this.showNotification('Please enter a nickname', 'error');
                nicknameInput.focus();
                return;
            }
        }
        
        try {
            await this.connectWebSocket();
            this.ws.send(JSON.stringify({
                type: 'join_room',
                roomCode: roomCode,
                nickname: this.nickname
            }));
        } catch (error) {
            this.showNotification('Failed to connect to server', 'error');
        }
    }
    
    async joinRoomFromModal() {
        const roomCodeInput = document.getElementById('modal-room-code');
        const roomCode = roomCodeInput.value.trim().toUpperCase();
        
        if (!roomCode) {
            this.showNotification('Please enter a room code', 'error');
            roomCodeInput.focus();
            return;
        }
        
        try {
            await this.connectWebSocket();
            this.ws.send(JSON.stringify({
                type: 'join_room',
                roomCode: roomCode,
                nickname: this.nickname
            }));
            this.hideRoomModal();
        } catch (error) {
            this.showNotification('Failed to connect to server', 'error');
        }
    }
    
    handleRoomJoined(data) {
        const roomCode = data.roomCode;
        
        // Add room to our local storage
        if (!this.rooms.has(roomCode)) {
            this.rooms.set(roomCode, {
                code: roomCode,
                messages: []
            });
            this.addRoomToSidebar(roomCode);
        }
        
        // Update room messages
        const room = this.rooms.get(roomCode);
        room.messages = data.messages;
        
        // Show main screen if not already shown
        this.showMainScreen();
        
        // Switch to this room
        this.switchToRoom(roomCode);
        
        this.showNotification(`Joined room ${roomCode}`, 'success');
    }
    
    switchToRoom(roomCode) {
        // Update active room
        this.currentRoom = roomCode;
        
        // Update sidebar
        document.querySelectorAll('.room-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const roomItem = document.querySelector(`[data-room-code="${roomCode}"]`);
        if (roomItem) {
            roomItem.classList.add('active');
        }
        
        // Show chat area
        document.getElementById('no-room-selected').classList.add('hidden');
        document.getElementById('chat-area').classList.remove('hidden');
        
        // Update chat header
        document.getElementById('active-room-name').textContent = `Room`;
        document.getElementById('active-room-code').textContent = roomCode;
        
        // Display messages
        this.displayRoomMessages(roomCode);
        
        // Focus message input
        document.getElementById('message-text').focus();
    }
    
    displayRoomMessages(roomCode) {
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '';
        
        const room = this.rooms.get(roomCode);
        if (room && room.messages) {
            room.messages.forEach(msg => this.displayMessage(msg, true));
        }
    }
    
    addRoomToSidebar(roomCode) {
        const roomsList = document.getElementById('rooms-list');
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item';
        roomItem.setAttribute('data-room-code', roomCode);
        roomItem.innerHTML = `
            <h4>Room ${roomCode}</h4>
            <p>Click to join conversation</p>
        `;
        
        roomItem.addEventListener('click', () => this.switchToRoom(roomCode));
        roomsList.appendChild(roomItem);
    }
    
    sendMessage() {
        const messageInput = document.getElementById('message-text');
        const message = messageInput.value.trim();
        
        if (!message || !this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentRoom) {
            return;
        }
        
        this.ws.send(JSON.stringify({
            type: 'send_message',
            roomCode: this.currentRoom,
            message: message
        }));
        
        messageInput.value = '';
        messageInput.focus();
    }
    
    displayMessage(data, isHistoricalMessage = false) {
        // For real-time messages, only display if they belong to the current room
        if (data.type === 'message' && data.roomCode && data.roomCode !== this.currentRoom) {
            // Still save the message to the correct room, but don't display it
            if (this.rooms.has(data.roomCode)) {
                this.rooms.get(data.roomCode).messages.push(data);
            }
            return;
        }
        
        // Only display messages if we're currently viewing a room
        if (!this.currentRoom) return;
        
        const messagesContainer = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        const time = new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        if (data.type === 'message') {
            messageDiv.className = `message ${data.nickname === this.nickname ? 'own' : 'other'}`;
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="nickname">${this.escapeHtml(data.nickname)}</span>
                    <span class="time">${time}</span>
                </div>
                <div class="message-text">${this.escapeHtml(data.message)}</div>
            `;
        } else if (data.type === 'user_joined' || data.type === 'user_left') {
            messageDiv.className = 'message system';
            const action = data.type === 'user_joined' ? 'joined' : 'left';
            messageDiv.innerHTML = `
                <div class="system-message">
                    <span class="time">${time}</span>
                    ${this.escapeHtml(data.nickname)} ${action} the room
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Only add to room messages in memory if it's a new real-time message
        // Don't add historical messages back to memory when redisplaying
        if (!isHistoricalMessage && data.roomCode && this.rooms.has(data.roomCode)) {
            this.rooms.get(data.roomCode).messages.push(data);
        }
    }
    
    shareRoom() {
        if (!this.currentRoom) return;
        
        const shareUrl = `${window.location.origin}?room=${this.currentRoom}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Join my MEMCP room',
                text: `Join my chat room: ${this.currentRoom}`,
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showNotification('Room link copied to clipboard!', 'success');
            }).catch(() => {
                prompt('Copy this link to share the room:', shareUrl);
            });
        }
    }
    
    leaveCurrentRoom() {
        if (!this.currentRoom) return;
        
        // Remove room from sidebar
        const roomItem = document.querySelector(`[data-room-code="${this.currentRoom}"]`);
        if (roomItem) {
            roomItem.remove();
        }
        
        // Remove from memory
        this.rooms.delete(this.currentRoom);
        
        // Reset current room
        this.currentRoom = null;
        
        // Show no room state
        document.getElementById('chat-area').classList.add('hidden');
        document.getElementById('no-room-selected').classList.remove('hidden');
        
        this.showNotification('Left the room', 'info');
    }
    
    showMainScreen() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        document.getElementById('current-nickname').textContent = this.nickname;
    }
    
    showRoomModal() {
        document.getElementById('room-modal').classList.remove('hidden');
        document.getElementById('modal-join-section').classList.add('hidden');
    }
    
    hideRoomModal() {
        document.getElementById('room-modal').classList.add('hidden');
        document.getElementById('modal-join-section').classList.add('hidden');
        document.getElementById('modal-room-code').value = '';
    }
    
    logout() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        // Reset state
        this.currentRoom = null;
        this.nickname = null;
        this.rooms.clear();
        
        // Clear UI
        document.getElementById('rooms-list').innerHTML = '';
        document.getElementById('messages').innerHTML = '';
        document.getElementById('nickname').value = '';
        document.getElementById('room-code').value = '';
        
        // Show welcome screen
        document.getElementById('main-screen').classList.add('hidden');
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('join-section').classList.add('hidden');
        
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MEMCPChat();
});