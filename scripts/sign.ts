import message from './data/message.json';
import assert from 'assert';
import { SigningKey } from '@ethersproject/signing-key';
import { getMessage, getStructHash, keccak256 } from 'eip-712';

const EIP_3074_MAGIC = Buffer.from([0x03]);

const privateKey = process.argv[2];
assert(privateKey, 'No private key provided');

const signingKey = new SigningKey(privateKey);

const commit = getMessage(message, true);
console.log('Commit hash');
console.log(commit.toString('hex'));

const buffer = keccak256(
  Buffer.concat([
    EIP_3074_MAGIC,
    Buffer.from(message.domain.verifyingContract.slice(2).padStart(64, '0'), 'hex'),
    commit
  ]).toString('hex'),
  'hex'
);

const { r, s, v: recovery } = signingKey.signDigest(buffer);
const v = recovery - 27;

console.log();
console.log('Signature');
console.log(
  JSON.stringify(
    {
      r,
      s,
      v
    },
    null,
    2
  )
);

console.log();
console.log('Remix compatible signature');
console.log(JSON.stringify([r, s, v]));

console.log();
console.log('Remix compatible transaction');
console.log(
  JSON.stringify([
    message.message.nonce,
    message.message.payload.map((payload) => [payload.to, payload.value, payload.gasLimit, payload.data])
  ])
);
