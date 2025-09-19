# 🚀 Drift Chat - Disposable Chat Rooms

A lightweight, real-time chat application that creates temporary chat rooms for instant communication. Perfect for quick conversations, team collaboration, or ephemeral discussions.

## 📱 CLI Version Available!

**NPM Package**: [drift-chat-cli](https://www.npmjs.com/package/drift-chat-cli)

Install the terminal-based client for command-line chatting:

```bash
npm install -g drift-chat-cli
```


Then run: `drift`

**Features:**
- Chat with web users from your terminal
- Create and join rooms using the same codes
- Beautiful colored interface
- Real-time messaging
- Cross-platform support

## ✨ Features

- **Instant Room Creation**: Generate unique chat rooms with 6-character codes
- **Real-Time Messaging**: WebSocket-based instant messaging
- **Multi-Room Support**: Join and manage multiple chat rooms simultaneously
- **Auto-Join URLs**: Share direct links to rooms for seamless joining
- **Disposable Rooms**: Rooms automatically clean up when empty
- **No Registration Required**: Jump in with just a nickname
- **Mobile Responsive**: Works seamlessly across devices
- **Cute Auto-Generated Names**: Automatic nickname generation for quick access

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/abhinav162/drift
   cd drift
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Production Deployment

#### Docker Deployment (Recommended)

1. **Build and run with Docker Compose**

   ```bash
   docker-compose up -d --build
   ```

2. **Check deployment status**
   ```bash
   docker-compose ps
   docker-compose logs -f drift-chat
   ```

#### Manual Deployment

1. **Install dependencies**

   ```bash
   npm ci --only=production
   ```

2. **Start the server**
   ```bash
   npm start
   ```

## 🏗️ Architecture

### Backend (`server.js`)

- **WebSocket Server**: Real-time bidirectional communication
- **HTTP Server**: Serves static files and handles HTTP requests
- **Room Management**: In-memory room storage with automatic cleanup
- **Message Broadcasting**: Efficient message distribution to room participants

### Frontend (`public/`)

- **Single Page Application**: Vanilla JavaScript with modern ES6+ features
- **WebSocket Client**: Real-time communication with the server
- **Responsive UI**: Mobile-first design with CSS Grid/Flexbox
- **State Management**: Client-side room and message management

### Key Components

```
├── server.js              # Main server application
├── packages/cli/       # CLI client package
│   ├── cli.js             # CLI entry point
│   ├── package.json       # CLI package configuration
│   ├── README.md          # CLI documentation
│   └── modules/           # CLI modular components
│       ├── chat-client.js    # WebSocket client handler
│       ├── display.js        # Terminal UI management
│       ├── input-handler.js  # Keyboard input processing
│       ├── games.js          # Interactive games (trivia, fortune, art)
│       ├── emoji.js          # Emoji shortcuts and suggestions
│       └── version-checker.js # Auto-update notifications
├── package.json           # Main project dependencies and scripts
├── public/
│   ├── index.html         # Main HTML template
│   ├── script.js          # Client-side JavaScript
│   └── style.css          # Application styles
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Multi-container setup
├── nginx.conf            # Reverse proxy configuration
└── deploy.sh             # Deployment automation script
```

## 🔧 Configuration

### Environment Variables

| Variable   | Default       | Description             |
| ---------- | ------------- | ----------------------- |
| `NODE_ENV` | `development` | Application environment |
| `PORT`     | `3000`        | Server port             |

### Docker Configuration

The application runs on port 3000 inside the container and is mapped to port 3150 on the host for production deployment.

### Nginx Reverse Proxy

The included `nginx.conf` provides:

- SSL termination with Let's Encrypt
- WebSocket proxy support
- Proper headers for real-time communication
- HTTP to HTTPS redirection

## 📡 API Reference

### WebSocket Messages

#### Client to Server

**Create Room**

```json
{
  "type": "create_room"
}
```

**Join Room**

```json
{
  "type": "join_room",
  "roomCode": "ABC123",
  "nickname": "UserName"
}
```

**Send Message**

```json
{
  "type": "send_message",
  "roomCode": "ABC123",
  "message": "Hello, world!"
}
```

#### Server to Client

**Room Created**

```json
{
  "type": "room_created",
  "roomCode": "ABC123"
}
```

**Room Joined**

```json
{
  "type": "joined_room",
  "roomCode": "ABC123",
  "messages": [...]
}
```

**New Message**

```json
{
  "type": "message",
  "nickname": "UserName",
  "message": "Hello, world!",
  "roomCode": "ABC123",
  "timestamp": 1234567890123
}
```

**User Events**

```json
{
  "type": "user_joined",
  "nickname": "UserName",
  "timestamp": 1234567890123
}
```

**Error**

```json
{
  "type": "error",
  "message": "Room not found"
}
```

## 🔒 Security Features

- **Input Sanitization**: HTML escaping for all user-generated content
- **Room Code Validation**: Uppercase alphanumeric room codes
- **WebSocket Origin Validation**: Protocol-based connection security
- **No Data Persistence**: Messages exist only in memory during room lifetime
- **Automatic Cleanup**: Rooms are deleted when all users leave

## 📱 Usage

### Creating a Room

1. Enter a nickname
2. Click "Create Room"
3. Share the generated room code or URL

### Joining a Room

1. Enter a nickname
2. Click "Join Room"
3. Enter the 6-character room code
4. Start chatting!

### Auto-Join via URL

Share URLs in the format: `https://drift.gftrilo.store?room=ABC123`

Users clicking this link will:

- Get an auto-generated cute nickname
- Automatically join the specified room
- Start chatting immediately

## 🛠️ Development

### Project Structure

```
drift/
├── server.js              # Express + WebSocket server
├── public/
│   ├── index.html         # Main application UI
│   ├── script.js          # Client-side logic
│   └── style.css          # Styling
├── packages/
│   └── cli/               # CLI package (published to npm)
│       ├── cli.js         # Main CLI entry point
│       ├── package.json   # CLI package configuration
│       ├── README.md      # CLI-specific documentation
│       └── modules/       # Modular CLI components
│           ├── chat-client.js    # WebSocket client handler
│           ├── display.js        # Terminal UI management
│           ├── input-handler.js  # Keyboard input processing
│           ├── games.js          # Interactive games (trivia, fortune, art)
│           ├── emoji.js          # Emoji shortcuts and suggestions
│           └── version-checker.js # Auto-update notifications
├── package.json           # Main project dependencies and scripts
├── Dockerfile             # Container build instructions
├── docker-compose.yml     # Service orchestration
├── nginx.conf            # Reverse proxy config
└── deploy.sh             # Deployment automation
```

### Adding New Features

#### Web Application
1. **Server-side changes**: Modify `server.js` for new WebSocket message types
2. **Client-side changes**: Update `public/script.js` for new UI functionality
3. **Styling**: Edit `public/style.css` for visual changes

#### CLI Application
1. **Core functionality**: Add features in `packages/cli/modules/`
2. **UI components**: Extend `display.js` for new terminal interfaces
3. **Input handling**: Modify `input-handler.js` for new commands
4. **Games & activities**: Add to `games.js` or create new modules
5. **WebSocket integration**: Update `chat-client.js` for protocol changes

#### Development Workflow
1. **Test locally**: Use `node cli.js` in the CLI package directory
2. **Version management**: Update `package.json` version for releases
3. **Publishing**: CLI is automatically published to npm via GitHub Actions once merged to main

### Running Tests

Currently, the project doesn't include automated tests. Consider adding:

- Unit tests for server logic
- Integration tests for WebSocket communication
- End-to-end tests for user workflows

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
./deploy.sh
```

### Option 2: Docker Hub

```bash
docker build -t drift-chat .
docker run -p 3150:3000 drift-chat
```

### Option 3: Cloud Platforms

- **Heroku**: Use the included `Dockerfile`
- **Railway**: Direct deployment from Git
- **DigitalOcean App Platform**: Container-based deployment
- **AWS ECS/Fargate**: Container orchestration

### Option 4: VPS with Nginx

1. Clone repository to server
2. Run `./deploy.sh`
3. Configure nginx with provided `nginx.conf`
4. Set up SSL with Let's Encrypt

## 🔧 Troubleshooting

### Common Issues

**WebSocket Connection Failed**

- Check if the server is running on the correct port
- Verify firewall settings allow WebSocket connections
- Ensure nginx proxy configuration for WebSocket upgrade headers

**Room Not Found Error**

- Room codes are case-sensitive and expire when empty
- Verify the room code is correctly entered
- Check if the room was recently created and still active

**Docker Deployment Issues**

- Ensure Docker and Docker Compose are installed
- Check port conflicts (3150 should be available)
- Review container logs: `docker-compose logs drift-chat`

### Logs and Monitoring

**Docker Logs**

```bash
docker-compose logs -f drift-chat
```

**Server Logs**

- Connection events
- Room creation/deletion
- Error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style

- Use modern JavaScript (ES6+)
- Follow existing naming conventions
- Add comments for complex logic
- Ensure responsive design

## 📄 License

This project is open source. Please check the repository for specific license terms.

## 🎯 Roadmap

### ✅ Completed

- [x] **CLI Client** - Terminal-based chat client with full feature parity
- [x] **Cross-Platform Chat** - Web and CLI users can chat together seamlessly
- [x] **Interactive Games** - Trivia, fortune cookies, and ASCII art in CLI
- [x] **Emoji Support** - Emoji shortcuts with smart autocomplete suggestions
- [x] **Auto-Update Notifications** - CLI version checking and update prompts
- [x] **Modular Architecture** - Clean separation of concerns for better maintainability

### 🚧 In Progress

- [ ] **BYOS (Bring Your Own Server)** - Self-hosted server option with Docker image
- [ ] **CLI Docker Image** - Containerized CLI client for easy deployment
- [ ] **Contribution Guidelines** - Detailed docs for contributors

### 🔮 Planned Features

#### Core Functionality
- [ ] **Message Persistence** - Optional message history storage
- [ ] **Room Passwords** - Private rooms with password protection
- [ ] **User Typing Indicators** - See when someone is typing
- [ ] **Message Reactions** - React to messages with emojis
- [ ] **Room Member List** - See who's currently in the room

#### Advanced Features
- [ ] **Message Search** - Search through chat history
- [ ] **Custom Themes** - Personalize the chat interface
- [ ] **Bot Integration** - Add bots for automation and fun

#### Self-Hosting & Enterprise
- [ ] **BYOS Docker Image** - Complete server package for self-hosting
- [ ] **Multi-Server Federation** - Connect multiple Drift Chat servers
- [ ] **Admin Dashboard** - Server management and analytics
- [ ] **User Management** - Registration, profiles, and permissions


## 📞 Support

For issues, feature requests, or questions:

- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section

---

**Drift Chat** - Simple, fast, disposable chat rooms for the modern web.