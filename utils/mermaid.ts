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
    
    // Create unique filenames based on content hash
    const hash = crypto.createHash('md5').update(mermaidCode).digest('hex');
    const mermaidFile = path.join(tempDir, `${hash}.mmd`);
    const outputFile = path.join(tempDir, `${hash}.png`);
    
    // Write the Mermaid code to a temporary file
    fs.writeFileSync(mermaidFile, mermaidCode);
    
    // Use mmdc CLI to generate the PNG
    const cliPath = path.resolve('./node_modules/.bin/mmdc');
    execSync(
      `"${cliPath}" -i "${mermaidFile}" -o "${outputFile}" -b transparent`,
      { stdio: 'ignore' }
    );
    
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