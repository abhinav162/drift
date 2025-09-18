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

    // Get emoji suggestions based on partial input after ':'
    getSuggestions(partialInput) {
        if (!partialInput) {
            // Return first 5 popular emojis when no input
            return [
                { shortcut: ':)', emoji: '😊', description: 'smile' },
                { shortcut: ':heart:', emoji: '❤️', description: 'heart' },
                { shortcut: ':thumbsup:', emoji: '👍', description: 'thumbs up' },
                { shortcut: ':fire:', emoji: '🔥', description: 'fire' },
                { shortcut: ':rocket:', emoji: '🚀', description: 'rocket' }
            ];
        }

        const suggestions = [];
        const lowercaseInput = partialInput.toLowerCase();

        // Find matching shortcuts (case insensitive)
        for (const [shortcut, emoji] of Object.entries(this.emojiMap)) {
            if (shortcut.toLowerCase().includes(lowercaseInput)) {
                // Extract description from shortcut (remove colons and convert to readable)
                let description = shortcut.replace(/:/g, '').replace(/-/g, ' ');
                if (description === ')' || description === 'D' || description === 'P') {
                    description = shortcut; // Keep original for simple emoticons
                }
                
                suggestions.push({
                    shortcut,
                    emoji,
                    description
                });
                
                // Limit to 5 suggestions
                if (suggestions.length >= 5) break;
            }
        }

        // Sort by relevance (exact matches first, then prefix matches)
        suggestions.sort((a, b) => {
            const aLower = a.shortcut.toLowerCase();
            const bLower = b.shortcut.toLowerCase();
            
            // Exact match (without colons) comes first
            const aExact = aLower === `:${lowercaseInput}:`;
            const bExact = bLower === `:${lowercaseInput}:`;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Prefix match comes next
            const aPrefix = aLower.startsWith(`:${lowercaseInput}`);
            const bPrefix = bLower.startsWith(`:${lowercaseInput}`);
            if (aPrefix && !bPrefix) return -1;
            if (!aPrefix && bPrefix) return 1;
            
            // Then by length (shorter first)
            return a.shortcut.length - b.shortcut.length;
        });

        return suggestions;
    }

    // Find the current emoji being typed at cursor position
    findCurrentEmojiContext(text, cursorPosition) {
        // Look backwards from cursor to find the start of emoji (last ':')
        let startPos = -1;
        for (let i = cursorPosition - 1; i >= 0; i--) {
            if (text[i] === ':') {
                startPos = i;
                break;
            }
            // If we hit a space or another special character, no emoji context
            if (text[i] === ' ' || text[i] === '\n' || text[i] === '\t') {
                break;
            }
        }

        if (startPos === -1) {
            return null; // No emoji context found
        }

        // Extract the partial emoji text (without the leading ':')
        const partialEmoji = text.substring(startPos + 1, cursorPosition);
        
        // Check if it looks like a valid emoji pattern (no spaces, special chars except - and _)
        if (!/^[a-zA-Z0-9_-]*$/.test(partialEmoji)) {
            return null;
        }

        return {
            startPos,
            endPos: cursorPosition,
            partialText: partialEmoji,
            fullText: ':' + partialEmoji
        };
    }
}

module.exports = Emoji;