import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const host = '127.0.0.1';
const backendBasePort = Number.parseInt(process.env.BACKEND_PORT ?? '3001', 10);
const frontendBasePort = Number.parseInt(process.env.FRONTEND_PORT ?? '5173', 10);

const children = [];
let shuttingDown = false;

function stopAll(signal = 'SIGTERM') {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function canUsePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, host);
  });
}

async function findAvailablePort(basePort) {
  for (let port = basePort; port < basePort + 50; port += 1) {
    if (await canUsePort(port)) {
      return port;
    }
  }

  throw new Error(`Tidak menemukan port kosong mulai dari ${basePort}.`);
}

function requestJson(url) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: 1000 }, (response) => {
      let body = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });

    request.on('error', () => {
      resolve(null);
    });
    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });
  });
}

async function findRunningBackend(basePort) {
  for (let port = basePort; port < basePort + 50; port += 1) {
    const url = `http://${host}:${port}`;
    const response = await requestJson(`${url}/api/health`);

    if (response?.data?.service === 'web-smkn2-next-backend') {
      return { port, url };
    }
  }

  return null;
}

function appendCorsOrigin(existingValue, origins) {
  const values = new Set(
    (existingValue ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

  for (const origin of origins) {
    values.add(origin);
  }

  return Array.from(values).join(',');
}

async function main() {
  const runningBackend = await findRunningBackend(backendBasePort);
  const backendPort = runningBackend?.port ?? (await findAvailablePort(backendBasePort));
  const frontendPort = await findAvailablePort(frontendBasePort);
  const backendUrl = runningBackend?.url ?? `http://${host}:${backendPort}`;
  const frontendOrigins = [
    `http://${host}:${frontendPort}`,
    `http://localhost:${frontendPort}`,
  ];

  const processes = [];

  if (runningBackend) {
    console.log(`Menggunakan backend yang sudah berjalan di ${backendUrl}`);
  } else {
    processes.push({
      name: 'backend',
      cwd: path.join(rootDir, 'backend'),
      args: [
        './node_modules/next/dist/bin/next',
        'dev',
        '--hostname',
        host,
        '--port',
        String(backendPort),
      ],
      env: {
        ...process.env,
        CORS_ORIGIN: appendCorsOrigin(process.env.CORS_ORIGIN, frontendOrigins),
      },
    });
  }

  processes.push({
    name: 'frontend',
    cwd: rootDir,
    args: [
      './node_modules/vite/bin/vite.js',
      '--host',
      host,
      '--port',
      String(frontendPort),
      '--strictPort',
    ],
    env: {
      ...process.env,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? backendUrl,
    },
  });

  if (!runningBackend) {
    console.log(`Menjalankan backend di ${backendUrl}`);
  }
  console.log(`Menjalankan frontend di http://${host}:${frontendPort}`);
  console.log('Tekan Ctrl + C untuk mematikan semuanya.\n');

  for (const item of processes) {
    const child = spawn(process.execPath, item.args, {
      cwd: item.cwd,
      env: item.env,
      stdio: 'inherit',
    });

    children.push(child);

    child.on('exit', (code, signal) => {
      if (!shuttingDown) {
        console.error(`\n${item.name} berhenti${signal ? ` karena ${signal}` : ` dengan kode ${code}`}.`);
        process.exitCode = code ?? 1;
        stopAll();
      }

      if (children.every((runningChild) => runningChild.exitCode !== null || runningChild.signalCode !== null)) {
        process.exit();
      }
    });
  }
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
