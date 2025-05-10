// vercel-build.js
// This script runs during the build step on Vercel to configure dependencies

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
  
  // Set NODE_ENV to production to avoid unnecessary dev dependencies
  process.env.NODE_ENV = 'production';
  
  // Create a .npmrc file to skip problematic downloads
  fs.writeFileSync(
    path.join(process.cwd(), '.npmrc'),
    'puppeteer_skip_chromium_download=true\n' +
    'playwright_skip_browser_download=true\n'
  );
  console.log('✅ Created .npmrc to skip browser downloads');
  
  // Ensure mermaid-cli is properly installed and available
  console.log('🔧 Checking mermaid-cli installation...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    // Load the package.json file
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if mermaid-cli is already in dependencies
    const hasMermaidCli = packageJson.dependencies && packageJson.dependencies['@mermaid-js/mermaid-cli'];
    
    if (!hasMermaidCli) {
      console.log('⚠️ @mermaid-js/mermaid-cli not found in package.json, adding it...');
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      packageJson.dependencies['@mermaid-js/mermaid-cli'] = '^11.4.2';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      // Install the updated package.json
      try {
        console.log('🔧 Installing mermaid-cli...');
        execSync('npm install --no-audit --no-fund --legacy-peer-deps', { stdio: 'inherit' });
        console.log('✅ mermaid-cli installed successfully');
      } catch (installError) {
        console.warn('⚠️ Could not install mermaid-cli:', installError.message);
      }
    } else {
      console.log('✅ @mermaid-js/mermaid-cli already in package.json');
    }
  }
  
  // Create a symlink for easier access to mermaid-cli's index.js
  const mmdcPath = path.join(process.cwd(), 'node_modules', '.bin', 'mmdc');
  const mermaidCliDir = path.join(process.cwd(), 'node_modules', '@mermaid-js', 'mermaid-cli');
  
  if (!fs.existsSync(mmdcPath) && fs.existsSync(mermaidCliDir)) {
    try {
      const indexJsPath = path.join(mermaidCliDir, 'index.js');
      
      if (fs.existsSync(indexJsPath)) {
        console.log('🔧 Creating mmdc command wrapper...');
        
        // Create a simple wrapper script that points to the index.js file
        const wrapperDir = path.join(process.cwd(), 'node_modules', '.bin');
        if (!fs.existsSync(wrapperDir)) {
          fs.mkdirSync(wrapperDir, { recursive: true });
        }
        
        const wrapperScript = `#!/usr/bin/env node
require('${indexJsPath.replace(/\\/g, '\\\\')}');
`;
        
        fs.writeFileSync(mmdcPath, wrapperScript);
        fs.chmodSync(mmdcPath, '755'); // Make executable
        
        console.log('✅ Created mmdc command wrapper at:', mmdcPath);
      }
    } catch (symlinkError) {
      console.warn('⚠️ Could not create mmdc wrapper:', symlinkError.message);
    }
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
  
  console.log('✅ Mermaid environment setup completed');
  
} catch (error) {
  console.error('❌ Error setting up mermaid environment:', error);
  // Don't exit with error to allow build to continue
} 