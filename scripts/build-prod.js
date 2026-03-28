import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const frontendDist = path.join(root, 'artifacts', 'salon-booking', 'dist');
const publicDist = path.join(root, 'public');

console.log('--- Starting Production Build ---');

try {
  // 1. Build frontend
  console.log('Step 1: Building frontend...');
  execSync('pnpm -r --filter @workspace/salon-booking run build', { stdio: 'inherit', cwd: root });

  // 2. Clear public directory
  console.log('Step 2: Preparing public directory...');
  if (fs.existsSync(publicDist)) {
    fs.rmSync(publicDist, { recursive: true, force: true });
  }
  fs.mkdirSync(publicDist, { recursive: true });

  // 3. Copy dist to public
  console.log('Step 3: Copying assets to public...');
  if (fs.existsSync(frontendDist)) {
      // On Windows, fs.cpSync is available in node 16.7+
      fs.cpSync(frontendDist, publicDist, { recursive: true });
      console.log('Assets successfully copied to public/');
  } else {
      console.error('Frontend dist directory not found at:', frontendDist);
      process.exit(1);
  }

  console.log('--- Build Complete ---');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
