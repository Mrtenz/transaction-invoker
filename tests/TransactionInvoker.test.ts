import { artifacts, ethers, waffle } from 'hardhat';
import { TransactionInvoker } from '../typechain';
import {
  emptyPayloadMessage,
  getAuthenticationMessage,
  getFixture,
  getSignature,
  multiPayloadMessage,
  simplePayloadMessage
} from './__fixtures__';
import { getMessage } from 'eip-712';
import { SigningKey } from '@ethersproject/signing-key';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

// The private key for the first signer
const SIGNER_PRIVATE_KEY = '0xeaf2c50dfd10524651e7e459c1286f0c2404eb0f34ffd2a1eb14373db49fceb6';

const deployContract = async () => {
  const signers = await ethers.getSigners();
  const invoker = await artifacts.readArtifact('TransactionInvoker');
  const contract = (await waffle.deployContract(signers[0], invoker)) as TransactionInvoker;

  return { contract, signers };
};

let contract: TransactionInvoker;
let signers: SignerWithAddress[];

beforeAll(async () => {
  const result = await deployContract();
  contract = result.contract;
  signers = result.signers;
});

describe('TransactionInvoker', () => {
  describe('invoke', () => {
    it('sends multiple transactions', async () => {
      const nonce = await contract.nonces(signers[0].address);

      const typedData = getFixture(multiPayloadMessage, contract.address, nonce.toNumber());
      const commit = getMessage(typedData, true);
      const message = getAuthenticationMessage(contract.address, commit);

      const signingKey = new SigningKey(SIGNER_PRIVATE_KEY);
      const signature = getSignature(signingKey.signDigest(message));

      const transaction = await contract.invoke(signature, typedData.message, { value: 2, gasLimit: 500000 });
      await expect(transaction.wait()).resolves.not.toThrow();
      await expect(ethers.provider.getBalance(signers[1].address)).resolves.toStrictEqual(BigNumber.from(1));
      await expect(ethers.provider.getBalance(signers[2].address)).resolves.toStrictEqual(BigNumber.from(1));
    });

    it('reverts if the value is too high', async () => {
      const nonce = await contract.nonces(signers[0].address);

      const typedData = getFixture(multiPayloadMessage, contract.address, nonce.toNumber());
      const commit = getMessage(typedData, true);
      const message = getAuthenticationMessage(contract.address, commit);

      const signingKey = new SigningKey(SIGNER_PRIVATE_KEY);
      const signature = getSignature(signingKey.signDigest(message));

      const transaction = await contract.invoke(signature, typedData.message, { value: 3, gasLimit: 500000 });
      await expect(transaction.wait()).rejects.toThrow();
    });

    it('reverts if the transaction has no payload', async () => {
      const nonce = await contract.nonces(signers[0].address);

      const typedData = getFixture(emptyPayloadMessage, contract.address, nonce.toNumber());
      const commit = getMessage(typedData, true);
      const message = getAuthenticationMessage(contract.address, commit);

      const signingKey = new SigningKey(SIGNER_PRIVATE_KEY);
      const signature = getSignature(signingKey.signDigest(message));

      const transaction = await contract.invoke(signature, typedData.message, { gasLimit: 500000 });
      await expect(() => transaction.wait()).rejects.toThrow();
    });

    it('reverts if the signature is invalid', async () => {
      const nonce = await contract.nonces(signers[0].address);
      const typedData = getFixture(simplePayloadMessage, contract.address, nonce.toNumber());

      const transaction = await contract.invoke(
        {
          r: '0x0000000000000000000000000000000000000000000000000000000000000000',
          s: '0x0000000000000000000000000000000000000000000000000000000000000000',
          v: false
        },
        typedData.message,
        {
          gasLimit: 500000
        }
      );

      await expect(() => transaction.wait()).rejects.toThrow();
    });
  });
});
