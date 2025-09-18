class Emoji {
    constructor() {
        // Emoji shortcuts mapping
        this.emojiMap = {
            // Basic expressions
            ':)': '😊', ':-)': '😊', ':smile:': '😊',
            ':(': '😢', ':-(': '😢', ':sad:': '😢',
            ':D': '😃', ':-D': '😃', ':grin:': '😃',
            ':P': '😛', ':-P': '😛', ':tongue:': '😛',
            ';)': '😉', ';-)': '😉', ':wink:': '😉',
            ':o': '😮', ':O': '😮', ':surprised:': '😮',
            
            // Emotions
            ':heart:': '❤️', '<3': '❤️',
            ':laugh:': '😂', ':lol:': '😂',
            ':cool:': '😎', ':sunglasses:': '😎',
            ':thinking:': '🤔', ':think:': '🤔',
            ':cry:': '😭', ':angry:': '😠',
            ':love:': '😍', ':kiss:': '😘',
            
            // Gestures
            ':thumbsup:': '👍', ':+1:': '👍',
            ':thumbsdown:': '👎', ':-1:': '👎',
            ':clap:': '👏', ':applause:': '👏',
            ':wave:': '👋', ':hi:': '👋', ':bye:': '👋',
            ':ok:': '👌', ':peace:': '✌️',
            ':facepalm:': '🤦',
            
            // Objects & symbols
            ':fire:': '🔥', ':rocket:': '🚀',
            ':party:': '🎉', ':celebrate:': '🎉',
            ':star:': '⭐', ':sparkles:': '✨',
            ':check:': '✅', ':cross:': '❌',
            ':warning:': '⚠️', ':info:': 'ℹ️',
            ':question:': '❓', ':exclamation:': '❗',
            
            // Food & drinks
            ':coffee:': '☕', ':tea:': '🍵',
            ':pizza:': '🍕', ':beer:': '🍺',
            ':cake:': '🍰', ':cookie:': '🍪',
            
            // Tech & coding
            ':computer:': '💻', ':code:': '💻',
            ':bug:': '🐛', ':gear:': '⚙️',
            ':bulb:': '💡', ':zap:': '⚡',
            
            // Misc
            ':eyes:': '👀', ':brain:': '🧠',
            ':muscle:': '💪', ':magic:': '🪄',
            ':100:': '💯', ':money:': '💰'
        };
    }

    // Convert emoji shortcuts in text to actual emojis
    convertEmojis(text) {
        let convertedText = text;
        
        // Sort by length (longest first) to avoid partial replacements
        const sortedShortcuts = Object.keys(this.emojiMap).sort((a, b) => b.length - a.length);
        
        sortedShortcuts.forEach(shortcut => {
            const emoji = this.emojiMap[shortcut];
            // Use global replace to convert all instances
            convertedText = convertedText.replace(new RegExp(this.escapeRegExp(shortcut), 'g'), emoji);
        });
        
        return convertedText;
    }

    // Escape special regex characters
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Get a random emoji
    getRandomEmoji() {
        const emojis = Object.values(this.emojiMap);
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    // Show emoji help
    getEmojiHelp() {
        const categories = {
            'Expressions': [':)', ':(', ':D', ':P', ';)', ':o'],
            'Emotions': [':heart:', ':laugh:', ':cool:', ':thinking:', ':love:'],
            'Gestures': [':thumbsup:', ':clap:', ':wave:', ':ok:', ':facepalm:'],
            'Symbols': [':fire:', ':rocket:', ':party:', ':star:', ':check:', ':cross:'],
            'Food': [':coffee:', ':pizza:', ':beer:', ':cake:'],
            'Tech': [':computer:', ':bug:', ':bulb:', ':zap:']
        };

        return categories;
    }

    // Check if text contains emoji shortcuts
    hasEmojiShortcuts(text) {
        return Object.keys(this.emojiMap).some(shortcut => text.includes(shortcut));
    }
}

module.exports = Emoji;