import { keccak256 } from 'eip-712';
import { Signature } from '@ethersproject/bytes';
import emptyPayload from './empty-payload.json';
import simplePayload from './simple-payload.json';
import multiPayload from './multi-payload.json';

const EIP_3074_MAGIC = Buffer.from([0x03]);

export const emptyPayloadMessage = emptyPayload;
export const simplePayloadMessage = simplePayload;
export const multiPayloadMessage = multiPayload;

export const getFixture = <T extends { domain: { verifyingContract: string }; message: { nonce: number } }>(
  fixture: T,
  verifyingContract: string,
  nonce: number
): T => {
  return {
    ...fixture,
    domain: {
      ...fixture.domain,
      verifyingContract
    },
    message: {
      ...fixture.message,
      nonce
    }
  };
};

export const getSignature = ({ r, s, v }: Signature): { r: string; s: string; v: boolean } => {
  return {
    r,
    s,
    v: Boolean(v - 27)
  };
};

export const getAuthenticationMessage = (address: string, commit: Buffer): Buffer => {
  return keccak256(
    Buffer.concat([EIP_3074_MAGIC, Buffer.from(address.slice(2).padStart(64, '0'), 'hex'), commit]).toString('hex'),
    'hex'
  );
};
