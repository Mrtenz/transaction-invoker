import { execSync, spawn } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';
import rimraf from 'rimraf';

const ROOT_DIR = resolve(__dirname, '..');
const GETH_DIR = resolve(ROOT_DIR, 'geth');
const GETH_DATA_DIR = resolve(GETH_DIR, 'data');
const PASSWORD_FILE = resolve(GETH_DIR, 'password');
const GENESIS_FILE = resolve(GETH_DIR, 'genesis.json');
const GETH_EXECUTABLE = resolve(ROOT_DIR, 'bin/geth/build/bin/geth');

const GETH_ARGS = `--datadir ${GETH_DATA_DIR} --nodiscover --port 30304 --networkid 224525 --http --http.port 8546 --allow-insecure-unlock --unlock 0xc6D5a3c98EC9073B54FA0969957Bd582e8D874bf --password ${PASSWORD_FILE} --mine`;

// Initializes the private Geth network with the provided genesis file
const executable = existsSync(GETH_EXECUTABLE) ? GETH_EXECUTABLE : 'geth';
execSync(`${executable} init --datadir ${GETH_DATA_DIR} ${GENESIS_FILE}`, { stdio: 'ignore' });

// Runs the Geth node
const geth = spawn(executable, GETH_ARGS.split(' '));

try {
  execSync('yarn jest', { cwd: ROOT_DIR, stdio: 'inherit' });
} catch (e) {
  console.error(e);
} finally {
  // Kills the Geth node after the tests and clears the network data
  geth.kill();
  rimraf.sync(resolve(GETH_DATA_DIR, 'geth'));
}
