import { getMessage, keccak256 } from 'eip-712';
import { BigNumber } from 'ethers';
import { SigningKey } from '@ethersproject/signing-key';
import payload from './payload.json';

// The private key for the first signer
export const SIGNER_PRIVATE_KEY = '0xeaf2c50dfd10524651e7e459c1286f0c2404eb0f34ffd2a1eb14373db49fceb6';

const EIP_3074_MAGIC = Buffer.from([0x03]);

interface Message {
  [key: string]: unknown;

  nonce: BigNumber | number;
  payload: {
    to: string;
    value: number;
    gasLimit: number;
    data: string;
  }[];
}

interface Signature {
  r: string;
  s: string;
  v: boolean;
}

const getAuthenticationMessage = (address: string, commit: Buffer): Buffer => {
  return keccak256(
    Buffer.concat([EIP_3074_MAGIC, Buffer.from(address.slice(2).padStart(64, '0'), 'hex'), commit]).toString('hex'),
    'hex'
  );
};

export const getSignature = (verifyingContract: string, message: Message): Signature => {
  const typedData = {
    ...payload,
    domain: {
      ...payload.domain,
      verifyingContract
    },
    message
  };

  const commit = getMessage(typedData, true);
  const authenticationMessage = getAuthenticationMessage(verifyingContract, commit);

  const signingKey = new SigningKey(SIGNER_PRIVATE_KEY);
  const { r, s, v } = signingKey.signDigest(authenticationMessage);

  return {
    r,
    s,
    v: Boolean(v - 27)
  };
};
