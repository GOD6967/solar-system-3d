// Publishes the built `dist/` folder to the `gh-pages` branch (GitHub Pages).
// Usage: npm run deploy
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, rmSync } from 'node:fs';

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const read = cmd => execSync(cmd, { encoding: 'utf8' }).trim();

const remote = read('git remote get-url origin');

console.log('Building...');
run('npm run build');

// Tell GitHub Pages not to run Jekyll over the output
writeFileSync('dist/.nojekyll', '');

if (existsSync('dist/.git')) rmSync('dist/.git', { recursive: true, force: true });

console.log(`Publishing dist/ to ${remote} (gh-pages)...`);
run('git init -q -b gh-pages', 'dist');
run('git add -A', 'dist');
run('git commit -q -m "Deploy"', 'dist');
run(`git push -f ${remote} gh-pages`, 'dist');
rmSync('dist/.git', { recursive: true, force: true });

console.log('Done. Live in about a minute at https://<your-username>.github.io/solar-system-3d/');
