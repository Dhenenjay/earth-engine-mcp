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
  try {
    // Clean and normalize the mermaid code
    const cleanMermaidCode = mermaidCode.trim();
    console.log('Rendering Mermaid diagram...');

    // Start a browser instance
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport to ensure diagram is properly rendered
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2, // Higher resolution
      });

      // HTML template that uses Mermaid library
      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
          <script>
            mermaid.initialize({
              startOnLoad: true,
              theme: 'default',
              securityLevel: 'loose',
              themeCSS: '.node rect { fill: #fff; }',
              logLevel: 1
            });
          </script>
          <style>
            body { 
              background: transparent;
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }
            .mermaid {
              padding: 10px;
            }
          </style>
        </head>
        <body>
          <div class="mermaid">
            ${cleanMermaidCode}
          </div>
        </body>
      </html>`;

      // Load the HTML content
      await page.setContent(html);
      
      // Wait for Mermaid to render
      await page.waitForSelector('.mermaid svg');
      
      // Wait a bit more to ensure rendering is complete
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      // Get the SVG element
      const svgElement = await page.$('.mermaid svg');
      
      if (!svgElement) {
        throw new Error('SVG element not found after rendering');
      }
      
      // Get the bounding box of the SVG
      const boundingBox = await svgElement.boundingBox();
      
      if (!boundingBox) {
        throw new Error('Could not determine SVG dimensions');
      }
      
      // Take a screenshot of just the SVG element
      const screenshot = await svgElement.screenshot({
        type: 'png',
        omitBackground: true, // Transparent background
      });
      
      // Convert to base64
      return Buffer.from(screenshot).toString('base64');
    } finally {
      // Always close the browser
      await browser.close();
    }
  } catch (error: unknown) {
    console.error('Error rendering Mermaid diagram:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to render Mermaid diagram: ${errorMessage}`);
  }
} 