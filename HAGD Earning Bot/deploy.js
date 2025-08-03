#!/usr/bin/env node

/**
 * HAGD Bot Deployment Script
 * Automated deployment and health check for the HAGD Earning Bot
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentManager {
    constructor() {
        this.requiredEnvVars = [
            'TELEGRAM_BOT_TOKEN',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_PRIVATE_KEY',
            'FIREBASE_CLIENT_EMAIL',
            'JWT_SECRET',
            'ADMIN_PASSWORD'
        ];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    checkEnvironment() {
        this.log('🔍 Checking environment configuration...');
        
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            this.log('❌ .env file not found!', 'error');
            return false;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const missingVars = [];

        for (const varName of this.requiredEnvVars) {
            if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`)) {
                missingVars.push(varName);
            }
        }

        if (missingVars.length > 0) {
            this.log(`❌ Missing or incomplete environment variables: ${missingVars.join(', ')}`, 'error');
            return false;
        }

        this.log('✅ Environment configuration looks good!', 'success');
        return true;
    }

    checkDependencies() {
        this.log('📦 Checking dependencies...');
        
        const packagePath = path.join(__dirname, 'package.json');
        if (!fs.existsSync(packagePath)) {
            this.log('❌ package.json not found!', 'error');
            return false;
        }

        const nodeModulesPath = path.join(__dirname, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            this.log('⚠️  node_modules not found. Installing dependencies...', 'warning');
            return this.installDependencies();
        }

        // Check if firebase-admin is installed
        const firebaseAdminPath = path.join(nodeModulesPath, 'firebase-admin');
        if (!fs.existsSync(firebaseAdminPath)) {
            this.log('⚠️  firebase-admin not found. Installing...', 'warning');
            return this.installDependencies();
        }

        this.log('✅ Dependencies are installed!', 'success');
        return true;
    }

    installDependencies() {
        return new Promise((resolve) => {
            this.log('📥 Installing dependencies...');
            const npm = spawn('npm', ['install'], { stdio: 'inherit' });
            
            npm.on('close', (code) => {
                if (code === 0) {
                    this.log('✅ Dependencies installed successfully!', 'success');
                    resolve(true);
                } else {
                    this.log('❌ Failed to install dependencies!', 'error');
                    resolve(false);
                }
            });
        });
    }

    async healthCheck() {
        this.log('🏥 Performing health check...');
        
        try {
            // Test Firebase connection
            const admin = require('firebase-admin');
            if (admin.apps.length === 0) {
                this.log('⚠️  Firebase not initialized. This is normal on first run.', 'warning');
            }

            // Test server startup
            const server = require('./server.js');
            this.log('✅ Server can be loaded successfully!', 'success');
            
            return true;
        } catch (error) {
            this.log(`❌ Health check failed: ${error.message}`, 'error');
            return false;
        }
    }

    async deploy() {
        this.log('🚀 Starting HAGD Bot deployment...', 'info');
        
        // Step 1: Environment check
        if (!this.checkEnvironment()) {
            this.log('❌ Deployment failed: Environment configuration issues', 'error');
            return false;
        }

        // Step 2: Dependencies check
        if (!await this.checkDependencies()) {
            this.log('❌ Deployment failed: Dependency issues', 'error');
            return false;
        }

        // Step 3: Health check
        if (!await this.healthCheck()) {
            this.log('❌ Deployment failed: Health check issues', 'error');
            return false;
        }

        // Step 4: Start the bot
        this.log('🎉 All checks passed! Starting HAGD Bot...', 'success');
        this.startBot();
        
        return true;
    }

    startBot() {
        this.log('🤖 Launching HAGD Earning Bot...', 'info');
        
        const bot = spawn('node', ['server.js'], {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'production' }
        });

        bot.on('close', (code) => {
            if (code === 0) {
                this.log('✅ Bot stopped gracefully', 'success');
            } else {
                this.log(`❌ Bot stopped with code ${code}`, 'error');
            }
        });

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.log('🛑 Shutting down HAGD Bot...', 'warning');
            bot.kill('SIGINT');
        });

        process.on('SIGTERM', () => {
            this.log('🛑 Terminating HAGD Bot...', 'warning');
            bot.kill('SIGTERM');
        });
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deployer = new DeploymentManager();
    deployer.deploy().catch(error => {
        console.error('Deployment failed:', error);
        process.exit(1);
    });
}

module.exports = DeploymentManager;
