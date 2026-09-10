const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('🚀 Starting Dewmina Super Line Bus Booking App...\n');

// Start backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: backendDir,
  shell: true,
  stdio: 'inherit',
});

// Start frontend
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  shell: true,
  stdio: 'inherit',
});

function cleanup() {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
