// test-mermaid.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing mermaid-cli implementation...');

try {
  // Path to mmdc binary in node_modules
  const mmdcPath = path.join(process.cwd(), 'node_modules', '.bin', 'mmdc');
  
  // Test if mmdc exists
  if (!fs.existsSync(mmdcPath)) {
    throw new Error(`mermaid-cli not found at: ${mmdcPath}`);
  }
  
  console.log(`✅ Found mermaid-cli at: ${mmdcPath}`);
  
  // Test directory
  const testDir = path.join(process.cwd(), 'test-output');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Test files
  const mermaidFile = path.join(testDir, 'test-diagram.mmd');
  const outputFile = path.join(testDir, 'test-diagram.png');
  
  // Simple test diagram
  const testDiagram = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A`;
  
  // Write test file
  fs.writeFileSync(mermaidFile, testDiagram);
  console.log(`✅ Created test file at: ${mermaidFile}`);
  
  // Run mermaid-cli
  console.log('⏳ Running mermaid-cli...');
  execSync(`"${mmdcPath}" -i "${mermaidFile}" -o "${outputFile}" -b transparent -p puppeteer-config.json`, { 
    stdio: 'inherit'
  });
  
  // Check if output was created
  if (fs.existsSync(outputFile)) {
    console.log(`✅ Successfully generated diagram at: ${outputFile}`);
    
    // Get file size
    const stats = fs.statSync(outputFile);
    console.log(`📊 Output file size: ${stats.size} bytes`);
    
    console.log('✅ Test completed successfully!');
  } else {
    console.error('❌ Failed to generate output file');
  }
} catch (error) {
  console.error('❌ Test failed:', error);
} 