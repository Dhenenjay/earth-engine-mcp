// vercel-build.js
// This script runs during the build step on Vercel to configure browser dependencies

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment for Mermaid diagram rendering...');

try {
  // Create necessary cache directories
  const cacheDir = path.join(process.cwd(), '.cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  const tmpDir = '/tmp';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  // Skip browser installation on Vercel - we'll set puppeteer to work with externally provided Chrome
  console.log('🔧 Configuring Puppeteer to use system Chrome in serverless environment...');
  
  // Make sure mermaid-cli is executable
  const mmdcPath = path.join(process.cwd(), 'node_modules', '.bin', 'mmdc');
  if (fs.existsSync(mmdcPath)) {
    console.log('🔧 Setting permissions for mermaid-cli...');
    try {
      execSync(`chmod +x "${mmdcPath}"`, { stdio: 'inherit' });
      console.log('✅ mermaid-cli permissions set');
    } catch (error) {
      console.warn('⚠️ Could not set permissions for mermaid-cli, but continuing:', error.message);
    }
  } else {
    console.warn('⚠️ mmdc binary not found at expected location, it may need to be installed');
  }
  
  // Create puppeteer config for mermaid-cli that uses Chrome in Path
  const puppeteerConfig = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    headless: true,
    ignoreHTTPSErrors: true
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'puppeteer-config.json'), 
    JSON.stringify(puppeteerConfig, null, 2)
  );
  console.log('✅ Created puppeteer-config.json with configuration for mermaid-cli');
  
  // Create a .npmrc file to skip Puppeteer download
  fs.writeFileSync(
    path.join(process.cwd(), '.npmrc'),
    'puppeteer_skip_chromium_download=true\n'
  );
  console.log('✅ Created .npmrc to skip Puppeteer browser download');
  
  console.log('✅ Mermaid environment setup completed');
  
} catch (error) {
  console.error('❌ Error setting up mermaid environment:', error);
  // Don't exit with error to allow build to continue
  // process.exit(1);
} 