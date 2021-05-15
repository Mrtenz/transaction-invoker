import { artifacts, ethers, waffle } from 'hardhat';
import { MockERC20, MockInvalid, MockTokenReceiver, TransactionInvoker } from '../typechain';
import { getSignature } from './__fixtures__';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const deployContract = async () => {
  const signers = await ethers.getSigners();

  const contractAbi = await artifacts.readArtifact('TransactionInvoker');
  const tokenAbi = await artifacts.readArtifact('MockERC20');
  const invalidAbi = await artifacts.readArtifact('MockInvalid');
  const receiverAbi = await artifacts.readArtifact('MockTokenReceiver');

  const [contract, token, invalid, receiver] = await Promise.all([
    waffle.deployContract(signers[0], contractAbi, undefined, { nonce: 0 }) as Promise<TransactionInvoker>,
    waffle.deployContract(signers[0], tokenAbi, undefined, { nonce: 1 }) as Promise<MockERC20>,
    waffle.deployContract(signers[0], invalidAbi, undefined, { nonce: 2 }) as Promise<MockInvalid>,
    waffle.deployContract(signers[0], receiverAbi, undefined, { nonce: 3 }) as Promise<MockTokenReceiver>
  ]);

  return { contract, token, invalid, receiver, signers };
};

let contract: TransactionInvoker;
let token: MockERC20;
let invalid: MockInvalid;
let receiver: MockTokenReceiver;

let signers: SignerWithAddress[];

beforeAll(async () => {
  const result = await deployContract();

  contract = result.contract;
  token = result.token;
  invalid = result.invalid;
  receiver = result.receiver;

  signers = result.signers;
});

describe('TransactionInvoker', () => {
  describe('invoke', () => {
    it('sends multiple transactions', async () => {
      const nonce = await contract.nonces(signers[0].address);
      const message = {
        nonce,
        payload: [
          {
            to: signers[1].address,
            value: 1,
            gasLimit: 1000000,
            data: '0x'
          },
          {
            to: signers[2].address,
            value: 1,
            gasLimit: 1000000,
            data: '0x'
          }
        ]
      };

      const signature = getSignature(contract.address, message);

      const transaction = await contract.invoke(signature, message, { value: 2 });
      await expect(transaction.wait()).resolves.not.toThrow();
      await expect(ethers.provider.getBalance(signers[1].address)).resolves.toStrictEqual(ethers.BigNumber.from(1));
      await expect(ethers.provider.getBalance(signers[2].address)).resolves.toStrictEqual(ethers.BigNumber.from(1));
    });

    it('sends multiple contract interactions', async () => {
      const nonce = await contract.nonces(signers[0].address);
      const message = {
        nonce,
        payload: [
          {
            to: token.address,
            value: 0,
            gasLimit: 1000000,
            data: token.interface.encodeFunctionData('mint', [3])
          },
          {
            to: token.address,
            value: 0,
            gasLimit: 1000000,
            data: token.interface.encodeFunctionData('approve', [receiver.address, 1])
          },
          {
            to: receiver.address,
            value: 0,
            gasLimit: 1000000,
            data: receiver.interface.encodeFunctionData('deposit', [token.address])
          }
        ]
      };

      const signature = getSignature(contract.address, message);

      const transaction = await contract.invoke(signature, message);
      await expect(transaction.wait()).resolves.not.toThrow();
      await expect(token.balanceOf(signers[0].address)).resolves.toStrictEqual(ethers.BigNumber.from(2));
      await expect(receiver.balanceOf(signers[0].address)).resolves.toStrictEqual(ethers.BigNumber.from(1));
    });

    it('reverts if a transaction fails', async () => {
      const nonce = await contract.nonces(signers[0].address);
      const message = {
        nonce,
        payload: [
          {
            to: signers[3].address,
            value: 1,
            gasLimit: 1000000,
            data: '0x'
          },
          {
            to: invalid.address,
            value: 0,
            gasLimit: 1000000,
            data: '0x'
          }
        ]
      };

      const signature = getSignature(contract.address, message);

      const transaction = await contract.invoke(signature, message, { value: 1, gasLimit: 2000000 });
      await expect(transaction.wait()).rejects.toThrow();
      await expect(ethers.provider.getBalance(signers[3].address)).resolves.toStrictEqual(ethers.BigNumber.from(0));
    });

    it('reverts if the nonce is invalid', async () => {
      const nonce = await contract.nonces(signers[0].address);
      const message = {
        nonce: nonce.add(1),
        payload: [
          {
            to: signers[1].address,
            value: 1,
            gasLimit: 1000000,
            data: '0x'
          }
        ]
      };

      const signature = getSignature(contract.address, message);

      const transaction = await contract.invoke(signature, message, { value: 1, gasLimit: 1000000 });
      await expect(transaction.wait()).rejects.toThrow();
    });

    it('reverts if the value is too high', async () => {
      const nonce = await contract.nonces(signers[0].address);
      const message = {
        nonce: nonce,
        payload: [
          {
            to: signers[1].address,
            value: 1,
            gasLimit: 1000000,
            data: '0x'
          }
        ]
      };

      const signature = getSignature(contract.address, message);

      const transaction = await contract.invoke(signature, message, { value: 2, gasLimit: 1000000 });
      await expect(transaction.wait()).rejects.toThrow();
    });

    it('reverts if the transaction has no payload', async () => {
      const nonce = await contract.nonces(signers[0].address);
      const message = {
        nonce: nonce,
        payload: []
      };

      const signature = getSignature(contract.address, message);

      const transaction = await contract.invoke(signature, message, { gasLimit: 1000000 });
      await expect(transaction.wait()).rejects.toThrow();
    });

    it('reverts if the transaction has no payload', async () => {
      const nonce = await contract.nonces(signers[0].address);
      const message = {
        nonce: nonce,
        payload: [
          {
            to: signers[1].address,
            value: 1,
            gasLimit: 1000000,
            data: '0x'
          }
        ]
      };

      const signature = {
        r: '0x0000000000000000000000000000000000000000000000000000000000000000',
        s: '0x0000000000000000000000000000000000000000000000000000000000000000',
        v: false
      };

      const transaction = await contract.invoke(signature, message, { value: 1, gasLimit: 1000000 });
      await expect(transaction.wait()).rejects.toThrow();
    });
  });
});
