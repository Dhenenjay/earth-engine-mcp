import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Renders a Mermaid diagram code to PNG using mermaid-cli
 * @param mermaidCode The Mermaid diagram code to render
 * @returns The PNG data as a base64 string
 */
export async function renderMermaidToPng(mermaidCode: string): Promise<string> {
  try {
    console.log('Rendering Mermaid diagram using mermaid-cli...');
    
    // Create temp directory for files
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-'));
    
    // Save mermaid code to file
    const mermaidFile = path.join(tempDir, 'diagram.mmd');
    fs.writeFileSync(mermaidFile, mermaidCode);
    
    // Output PNG file path
    const outputFile = path.join(tempDir, 'diagram.png');
    
    // Path to mmdc binary in node_modules
    const mmdcPath = path.join(process.cwd(), 'node_modules', '.bin', 'mmdc');
    
    // Create puppeteer config
    const puppeteerConfigPath = path.join(tempDir, 'puppeteer-config.json');
    
    // For local development, find the Chrome headless shell path
    let executablePath;
    
    // Try to find Chrome headless shell in the user's cache
    const homeDir = os.homedir();
    const puppeteerCacheDir = path.join(homeDir, '.cache', 'puppeteer');
    
    if (fs.existsSync(puppeteerCacheDir)) {
      // Look for chrome-headless-shell directory
      const chromeHeadlessDir = path.join(puppeteerCacheDir, 'chrome-headless-shell');
      
      if (fs.existsSync(chromeHeadlessDir)) {
        // Find the most recent version
        const versions = fs.readdirSync(chromeHeadlessDir);
        
        if (versions.length > 0) {
          // Get the most recent version
          const latestVersion = versions
            .filter(dir => fs.statSync(path.join(chromeHeadlessDir, dir)).isDirectory())
            .sort()
            .pop();
          
          if (latestVersion) {
            // Find the executable path based on the platform
            const platform = os.platform();
            let execName = 'chrome-headless-shell';
            
            if (platform === 'win32') {
              execName = 'chrome-headless-shell.exe';
            }
            
            const possiblePaths = [
              path.join(chromeHeadlessDir, latestVersion, 'chrome-headless-shell-mac-arm64', execName),
              path.join(chromeHeadlessDir, latestVersion, 'chrome-headless-shell-mac-x64', execName),
              path.join(chromeHeadlessDir, latestVersion, 'chrome-headless-shell-linux-x64', execName),
              path.join(chromeHeadlessDir, latestVersion, 'chrome-headless-shell-win32-x64', execName),
            ];
            
            for (const p of possiblePaths) {
              if (fs.existsSync(p)) {
                executablePath = p;
                console.log(`Found Chrome headless shell at: ${executablePath}`);
                break;
              }
            }
          }
        }
      }
    }
    
    // Create the puppeteer config with the executable path if found
    const puppeteerConfig: any = {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    
    if (executablePath) {
      puppeteerConfig.executablePath = executablePath;
    }
    
    fs.writeFileSync(puppeteerConfigPath, JSON.stringify(puppeteerConfig, null, 2));
    
    // Execute the mermaid-cli command with puppeteer config
    const command = `"${mmdcPath}" -i "${mermaidFile}" -o "${outputFile}" -b transparent -p "${puppeteerConfigPath}"`;
    
    console.log(`Executing mermaid-cli command: ${command}`);
    
    // Set environment variables for Puppeteer in serverless environment
    const customEnv: NodeJS.ProcessEnv = {
      ...process.env,
      PUPPETEER_CACHE_DIR: homeDir ? path.join(homeDir, '.cache', 'puppeteer') : '/tmp',
    };
    
    // Execute command with specified environment
    await execPromise(command, { env: customEnv });
    
    // Check if output file exists
    if (!fs.existsSync(outputFile)) {
      throw new Error('Mermaid-cli did not generate output file');
    }
    
    // Read the generated PNG file
    const pngBuffer = fs.readFileSync(outputFile);
    
    // Clean up temporary files
    try {
      fs.unlinkSync(mermaidFile);
      fs.unlinkSync(outputFile);
      fs.unlinkSync(puppeteerConfigPath);
      fs.rmdirSync(tempDir);
    } catch (cleanupError) {
      console.warn('Warning: Failed to clean up temporary files:', cleanupError);
      // Continue anyway, not critical
    }
    
    // Convert to base64
    const base64Png = pngBuffer.toString('base64');
    console.log('Successfully rendered Mermaid diagram to PNG');
    
    return base64Png;
  } catch (error) {
    console.error('Error rendering Mermaid diagram with mermaid-cli:', error);
    
    // Throw a detailed error message
    throw new Error(`Failed to render Mermaid diagram: ${error instanceof Error ? error.message : String(error)}`);
  }
} 