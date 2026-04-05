const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('/*log_removed*/')) {
    let newContent = content;
    
    // Quick specific fixes for broken statements
    newContent = newContent.replace(/onLoad=\{\(\) => \/\*log_removed\*\/\.style\.display = 'none';/g, "onLoad={(e) => {(e.target as HTMLImageElement).style.display = 'none';");
    newContent = newContent.replace(/&& \/\*log_removed\*\//g, '');
    newContent = newContent.replace(/=> \/\*log_removed\*\//g, '=> null');
    newContent = newContent.replace(/if \([^)]+\)\s*\/\*log_removed\*\//g, '/* handled by next rule */');
    newContent = newContent.replace(/\/\*log_removed\*\//g, 'null');
    
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
    console.log('Fixed ' + file);
  }
});
console.log('Total fixed: ' + changedCount);
