const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  const replacements = [
    { from: /rgba\(16,185,129/g, to: 'rgba(37,99,235' },
    { from: /shadow-\[0_0_15px_rgba\(16,185,129,0\.15\)\]/g, to: 'shadow-sm' },
    { from: /shadow-\[0_0_15px_rgba\(16,185,129,0\.2\)\]/g, to: 'shadow-md' },
    { from: /shadow-\[0_0_15px_rgba\(16,185,129,0\.3\)\]/g, to: 'shadow-lg' },
    { from: /shadow-\[0_0_10px_rgba\(16,185,129,0\.5\)\]/g, to: 'shadow-md' },
    { from: /shadow-\[0_0_5px_rgba\(16,185,129,0\.5\)\]/g, to: 'shadow-sm' },
  ];

  for (const { from, to } of replacements) {
    newContent = newContent.replace(from, to);
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done replacing colors.');
