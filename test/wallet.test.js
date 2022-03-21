const Wallet = require('../src/wallet/wallet');
const Transaction = require('../src/wallet/transaction');
const { STARTING_BALANCE } = require('../config');
const { verifySignature } = require('../src/util');

describe('Wallet', () => {
  let wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  it('has a `balance`', () => {
    expect(wallet).toHaveProperty('balance');
  });

  it('has a initial balance equal to the starting balance', () => {
    expect(wallet.balance).toEqual(STARTING_BALANCE);
  });

  it('has a `publicKey`', () => {
    expect(wallet).toHaveProperty('publicKey');
  });

  describe('signing data', () => {
    const data = 'foobar';

    it('verifies a signature', () => {
      const result = verifySignature({
        publicKey: wallet.publicKey,
        signature: wallet.sign(data),
        data,
      });

      expect(result).toBe(true);
    });

    it('does not verify an invalid signature', () => {
      const result = verifySignature({
        publicKey: wallet.publicKey,
        signature: new Wallet().sign(data),
        data,
      });

      expect(result).toBe(false);
    });
  });

  describe('createTransaction', () => {
    describe('and the amount exceeds the balance', () => {
      it('throws an error', () => {
        expect(() => wallet.createTransaction({ amount: 999999, recipient: 'foo-recipient'}))
          .toThrow('Amount exceeds the balance');
      });
    });

    describe('and the amount is valid', () => {
      let transaction, amount, recipient;

      beforeEach(() => {
        amount = 50;
        recipient = 'foo-recipient';
        transaction = wallet.createTransaction({ amount, recipient });
      });

      it('creates an instance of `Transaction`', () => {
        expect(transaction instanceof Transaction).toBe(true);
      });

      it('matches the transaction input with the wallet', () => {
        expect(transaction.input.address).toEqual(wallet.publicKey);
      });

      it('outputs the amount the recipient', () => {
        expect(transaction.outputMap[recipient]).toEqual(amount);
      });
    });
  });
})