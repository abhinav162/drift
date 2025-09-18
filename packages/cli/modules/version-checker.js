const https = require('https');
const chalk = require('chalk');

class VersionChecker {
    constructor(packageName, currentVersion) {
        this.packageName = packageName;
        this.currentVersion = currentVersion;
    }

    // Compare two semantic versions (returns -1, 0, or 1)
    compareVersions(current, latest) {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        
        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const latestPart = latestParts[i] || 0;
            
            if (currentPart < latestPart) return -1;
            if (currentPart > latestPart) return 1;
        }
        
        return 0;
    }

    // Fetch latest version from npm registry
    async getLatestVersion() {
        return new Promise((resolve, reject) => {
            const url = `https://registry.npmjs.org/${this.packageName}/latest`;
            
            const req = https.get(url, { timeout: 3000 }, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const packageInfo = JSON.parse(data);
                        resolve(packageInfo.version);
                    } catch (error) {
                        reject(new Error('Failed to parse npm response'));
                    }
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.on('error', (error) => {
                reject(error);
            });
        });
    }

    // Check for updates and display notification if needed
    async checkForUpdates() {
        try {
            const latestVersion = await this.getLatestVersion();
            const comparison = this.compareVersions(this.currentVersion, latestVersion);
            
            if (comparison < 0) {
                this.displayUpdateNotification(latestVersion);
                return true;
            }
            
            return false;
        } catch (error) {
            // Silently fail - don't interrupt the user experience
            return false;
        }
    }

    // Display update notification
    displayUpdateNotification(latestVersion) {
        console.log(chalk.yellow('┌─────────────────────────────────────────────────────────────┐'));
        console.log(chalk.yellow('│') + chalk.white('  📦 New version available! ') + chalk.green(`v${latestVersion}`) + chalk.gray(` (current: v${this.currentVersion})`) + ' '.repeat(Math.max(0, 7 - latestVersion.length - this.currentVersion.length)) + chalk.yellow('│'));
        console.log(chalk.yellow('│') + chalk.white('  Run: ') + chalk.cyan('npm install -g drift-chat-cli') + chalk.white(' to update') + ' '.repeat(13) + chalk.yellow('│'));
        console.log(chalk.yellow('└─────────────────────────────────────────────────────────────┘'));
        console.log(); // Add space after notification
    }
}

module.exports = VersionChecker;