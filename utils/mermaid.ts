import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

/**
 * Renders a Mermaid diagram code to PNG and returns the PNG data as a base64 string
 * @param mermaidCode The Mermaid diagram code to render
 * @returns The PNG image data as a base64 string
 */
export async function renderMermaidToPng(mermaidCode: string): Promise<string> {
  try {
    // Create a temporary directory for the files
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-'));
    console.log(`Created temp directory: ${tempDir}`);
    
    // Create unique filenames based on content hash
    const hash = crypto.createHash('md5').update(mermaidCode).digest('hex');
    const mermaidFile = path.join(tempDir, `${hash}.mmd`);
    const outputFile = path.join(tempDir, `${hash}.png`);
    
    // Write the Mermaid code to a temporary file
    fs.writeFileSync(mermaidFile, mermaidCode);
    console.log(`Wrote Mermaid code to: ${mermaidFile}`);
    
    // Find the mmdc CLI path
    let cliPath;
    
    // Check different potential locations
    const possiblePaths = [
      path.resolve('./node_modules/.bin/mmdc'),
      path.resolve('./node_modules/@mermaid-js/mermaid-cli/node_modules/.bin/mmdc'),
      path.resolve('./node_modules/.pnpm/@mermaid-js+mermaid-cli@11.4.2_puppeteer@24.8.2_typescript@5.8.3/node_modules/@mermaid-js/mermaid-cli/node_modules/.bin/mmdc')
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        cliPath = p;
        break;
      }
    }
    
    if (!cliPath) {
      // Fallback to looking for mmdc in general
      try {
        cliPath = execSync('which mmdc').toString().trim();
      } catch (e) {
        throw new Error('Could not find mmdc executable. Please make sure @mermaid-js/mermaid-cli is installed');
      }
    }
    
    console.log(`Using mmdc CLI path: ${cliPath}`);
    
    // Use mmdc CLI to generate the PNG
    const command = `"${cliPath}" -i "${mermaidFile}" -o "${outputFile}" -b transparent`;
    console.log(`Executing command: ${command}`);
    
    execSync(command, { stdio: 'inherit' });
    
    // Check if the output file was created
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Output file was not created at ${outputFile}`);
    }
    
    console.log(`Successfully generated PNG at: ${outputFile}`);
    
    // Read the generated PNG file as base64
    const pngData = fs.readFileSync(outputFile);
    const base64Data = pngData.toString('base64');
    
    // Clean up the temporary files
    fs.unlinkSync(mermaidFile);
    fs.unlinkSync(outputFile);
    fs.rmdirSync(tempDir);
    
    return base64Data;
  } catch (error: unknown) {
    console.error('Error rendering Mermaid diagram:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to render Mermaid diagram: ${errorMessage}`);
  }
} 