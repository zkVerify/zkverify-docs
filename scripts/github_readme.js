const fs = require('fs');
const path = require('path');
const axios = require('axios');

const remoteReadmes = [
  {
    githubOrg: 'HorizenLabs',
    githubRepo: 'zkverifyjs',
    githubBranch: 'main',
    markdownFile: 'DOCS.md'
  }
]

const fetchMarkdown = async (githubOrg, githubRepo, githubBranch = 'main', markdownFile = 'README.md') => {
  try {        
      // Fetch markdown
      const remotePath = `https://raw.githubusercontent.com/${githubOrg}/${githubRepo}/${githubBranch}/${markdownFile}`
      const response = await axios.get(remotePath);

      const text = response.data;
      
      // Define the path to the static/markdown folder
      const staticMarkdownDir = path.resolve(__dirname, '../static/markdown');

      // Ensure the static/markdown directory exists
      if (!fs.existsSync(staticMarkdownDir)) {
        fs.mkdirSync(staticMarkdownDir, { recursive: true });
      }

      // Define the path to the new file
      const filePath = path.join(staticMarkdownDir, `/${githubRepo}.md`);

      // Write data to the new file
      fs.writeFile(filePath, text, 'utf8', (err) => {
          if (err) {
          console.error('Error writing file:', err);
          } else {
          console.log('File written successfully to', filePath);
          }
      });
      console.log('File content updated successfully.');
  } catch (err) {
      console.error('Error:', err);
  }
}

for (const readme of remoteReadmes) {
  fetchMarkdown(readme.githubOrg, readme.githubRepo, readme.githubBranch, readme.markdownFile);
}
