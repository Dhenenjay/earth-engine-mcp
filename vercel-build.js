// vercel-build.js
// This script runs during the build step on Vercel to ensure proper dependencies are installed

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment for Mermaid diagram rendering...');

try {
  // Install Puppeteer browsers
  console.log('🎭 Installing Chrome headless shell for Puppeteer...');
  execSync('npx puppeteer browsers install chrome-headless-shell', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      PUPPETEER_CACHE_DIR: '/tmp'
    }
  });
  console.log('✅ Chrome headless shell installed successfully');
  
  // Install Playwright browsers as a fallback (if needed)
  console.log('🎭 Installing Chromium as fallback...');
  execSync('npx playwright install --with-deps chromium', { stdio: 'inherit' });
  console.log('✅ Chromium installed successfully');
  
  // Create necessary directories
  const cacheDir = path.join(process.cwd(), '.cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  // Make sure mermaid-cli is executable
  const mmdcPath = path.join(process.cwd(), 'node_modules', '.bin', 'mmdc');
  if (fs.existsSync(mmdcPath)) {
    console.log('🔧 Setting permissions for mermaid-cli...');
    execSync(`chmod +x "${mmdcPath}"`, { stdio: 'inherit' });
    console.log('✅ mermaid-cli permissions set');
  } else {
    console.warn('⚠️ mmdc binary not found at expected location, it may need to be installed');
  }
  
  // Find the Chrome headless shell location in Vercel environment
  let chromeExecPath = null;
  try {
    execSync('find /tmp -name "chrome-headless-shell" -type f 2>/dev/null', { stdio: 'pipe' })
      .toString()
      .trim()
      .split('\n')
      .forEach(path => {
        if (path && fs.existsSync(path)) {
          chromeExecPath = path;
          console.log(`✅ Found Chrome headless shell at: ${chromeExecPath}`);
        }
      });
  } catch (findError) {
    console.warn('⚠️ Could not search for Chrome headless shell:', findError.message);
  }
  
  // Create puppeteer config for mermaid-cli
  const puppeteerConfig = {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  
  // Add executable path if found
  if (chromeExecPath) {
    puppeteerConfig.executablePath = chromeExecPath;
  }
  
  fs.writeFileSync(
    path.join(process.cwd(), 'puppeteer-config.json'), 
    JSON.stringify(puppeteerConfig, null, 2)
  );
  console.log('✅ Created puppeteer-config.json with configuration for mermaid-cli');
  
  // Create a simple test to verify mermaid-cli works
  console.log('🧪 Testing mermaid-cli installation...');
  const testDir = path.join(process.cwd(), '.vercel', 'test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testMermaidFile = path.join(testDir, 'test.mmd');
  const testOutputFile = path.join(testDir, 'test.png');
  
  // Simple test diagram
  const testDiagram = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A`;
  
  fs.writeFileSync(testMermaidFile, testDiagram);
  
  try {
    // Test mermaid-cli
    execSync(`"${mmdcPath}" -i "${testMermaidFile}" -o "${testOutputFile}" -b transparent -p puppeteer-config.json`, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        PUPPETEER_CACHE_DIR: '/tmp'
      }
    });
    
    if (fs.existsSync(testOutputFile)) {
      console.log('✅ mermaid-cli test succeeded!');
      // Clean up test files
      fs.unlinkSync(testMermaidFile);
      fs.unlinkSync(testOutputFile);
    } else {
      console.warn('⚠️ mermaid-cli test did not produce output file');
    }
  } catch (testError) {
    console.warn('⚠️ mermaid-cli test failed:', testError.message);
    // Continue with build process even if test fails
  }
  
} catch (error) {
  console.error('❌ Error setting up mermaid environment:', error);
  // Don't exit with error to allow build to continue
  // process.exit(1);
} 