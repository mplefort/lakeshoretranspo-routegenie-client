#!/usr/bin/env node

console.log('✅ Node.js is working!');
console.log('📦 Testing dependencies...');

try {
  const fs = require('fs');
  const path = require('path');
  console.log('✅ fs and path modules work');
  
  const packageJson = require('./package.json');
  console.log(`✅ Package name: ${packageJson.name}`);
  
  // Test if we can access our source files
  const srcPath = path.join(__dirname, 'src');
  if (fs.existsSync(srcPath)) {
    console.log('✅ src directory found');
    
    const commandsPath = path.join(srcPath, 'commands');
    if (fs.existsSync(commandsPath)) {
      console.log('✅ commands directory found');
      
      const files = fs.readdirSync(commandsPath);
      console.log(`✅ Found ${files.length} files in commands:`, files);
    }
  }
  
  console.log('\n🎉 Basic setup is working! You can now run npm install if needed.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
