const chalk = require('chalk');

class Games {
    constructor() {
        this.triviaQuestions = [
            { q: "What planet is known as the Red Planet?", a: "Mars" },
            { q: "What's the largest mammal in the world?", a: "Blue Whale" },
            { q: "Which programming language was created by Guido van Rossum?", a: "Python" },
            { q: "What's the capital of Japan?", a: "Tokyo" },
            { q: "How many sides does a hexagon have?", a: "6" },
            { q: "What does HTML stand for?", a: "HyperText Markup Language" },
            { q: "Which element has the chemical symbol 'O'?", a: "Oxygen" },
            { q: "What year was JavaScript created?", a: "1995" },
            { q: "What's the smallest unit of matter?", a: "Atom" },
            { q: "Which company created React?", a: "Facebook" }
        ];

        this.fortunes = [
            "🥠 Your future is as bright as your faith allows it to be",
            "🥠 The best time to plant a tree was 20 years ago. The second best time is now",
            "🥠 A journey of a thousand miles begins with a single step",
            "🥠 You will find luck in unexpected places today",
            "🥠 The person who asks a question is a fool for 5 minutes. The person who doesn't ask is a fool forever",
            "🥠 Your code will compile on the first try today",
            "🥠 Debugging is twice as hard as writing code in the first place",
            "🥠 There are only two hard things in programming: cache invalidation and naming things",
            "🥠 The best error message is the one that never shows up",
            "🥠 Coffee + Code = ∞ possibilities"
        ];

        this.asciiArt = [
            `  /\\_/\\  \n ( o.o ) \n  > ^ <  \nMeow!`,
            `    /|   /|   \n   ( :v:  )   \n    |(_)|    \nRocket!`,
            `  ☁️ ☁️ ☁️\n☁️  😊  ☁️\n  ☁️ ☁️ ☁️\nHappy Cloud!`,
            `   🌟\n  ⭐⭐\n 🌟⭐🌟\n⭐⭐⭐⭐\nStars!`,
            `┌─┐┌─┐┌─┐\n│ ││ ││ │\n└─┘└─┘└─┘\nBoxes!`
        ];
    }

    getRandomTrivia() {
        const randomQuestion = this.triviaQuestions[Math.floor(Math.random() * this.triviaQuestions.length)];
        return {
            type: 'trivia',
            header: chalk.magenta('🧠 TRIVIA TIME!'),
            content: [
                chalk.white(`❓ ${randomQuestion.q}`),
                chalk.gray(`💡 Answer: ${randomQuestion.a}`)
            ]
        };
    }

    getRandomFortune() {
        const randomFortune = this.fortunes[Math.floor(Math.random() * this.fortunes.length)];
        return {
            type: 'fortune',
            header: chalk.yellow('🔮 YOUR FORTUNE:'),
            content: [chalk.white(randomFortune)]
        };
    }

    getRandomArt() {
        const randomArt = this.asciiArt[Math.floor(Math.random() * this.asciiArt.length)];
        return {
            type: 'art',
            header: chalk.cyan('🎨 ASCII ART GALLERY:'),
            content: [chalk.white(randomArt)]
        };
    }

    getAvailableCommands() {
        return [
            { command: '/trivia', description: 'Random trivia question' },
            { command: '/fortune', description: 'Fortune cookie wisdom' },
            { command: '/art', description: 'Random ASCII art' }
        ];
    }
}

module.exports = Games;