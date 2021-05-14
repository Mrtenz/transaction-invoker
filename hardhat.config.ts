import { resolve } from 'path';
import { subtask } from 'hardhat/config';
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from 'hardhat/builtin-tasks/task-names';

import '@nomiclabs/hardhat-solhint';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-typechain';

/**
 * This overrides the standard compiler version to use a custom compiled version. See `bin/README.md` for more
 * information.
 */
subtask<{ solcVersion: string }>(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args, hre, next) => {
  if (args.solcVersion === '0.8.2') {
    const compilerPath = resolve(__dirname, 'bin/solcjs-0.8.2.js');

    return {
      compilerPath,
      isSolcJs: true,
      version: args.solcVersion,
      longVersion: '0.8.2-develop.2021.5.12+commit.ee654cc3'
    };
  }

  return next();
});

export default {
  solidity: {
    version: '0.8.2'
  }
};
