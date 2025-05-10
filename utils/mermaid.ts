import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import puppeteer from 'puppeteer';

/**
 * Renders a Mermaid diagram code to PNG and returns the PNG data as a base64 string
 * @param mermaidCode The Mermaid diagram code to render
 * @returns The PNG image data as a base64 string
 */
export async function renderMermaidToPng(mermaidCode: string): Promise<string> {
  let browser = null;
  try {
    // Configure Puppeteer for both local and serverless environments
    const options = {
      headless: true,
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
    };

    // Launch browser
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    
    // HTML template with Mermaid
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@9.4.3/dist/mermaid.min.js"></script>
          <script>
            mermaid.initialize({
              startOnLoad: true,
              theme: 'default',
              securityLevel: 'loose',
            });
          </script>
          <style>
            body { 
              margin: 0;
              padding: 0;
              background: transparent;
            }
            #container {
              display: inline-block;
              padding: 10px;
            }
          </style>
        </head>
        <body>
          <div id="container">
            <div class="mermaid">
              ${mermaidCode}
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Set content and wait for Mermaid to render
    await page.setContent(html);
    await page.waitForFunction('window.mermaid && document.querySelector(".mermaid svg")');
    // Additional wait to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find the diagram element and screenshot it
    const element = await page.$('.mermaid');
    if (!element) {
      throw new Error('Mermaid diagram element not found');
    }

    const screenshot = await element.screenshot({
      omitBackground: true,
    });
    
    // Convert to base64
    const base64Data = Buffer.from(screenshot).toString('base64');
    
    return base64Data;
  } catch (error: unknown) {
    console.error('Error rendering Mermaid diagram:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to render Mermaid diagram: ${errorMessage}`);
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
    }
  }
} 