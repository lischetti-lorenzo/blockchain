const Wallet = require('../src/wallet/wallet');
const Transaction = require('../src/wallet/transaction');
const Blockchain = require('../src/blockchain/blockchain');
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

    describe('and a chain is passed', () => {
      it('calls `Wallet.calculateBalance()`', () => {
        const calculateBalanceMock = jest.fn();
        const originalCalculateBalance = Wallet.calculateBalance;

        Wallet.calculateBalance = calculateBalanceMock;

        wallet.createTransaction({
          recipient: 'foo-recipient',
          amount: 50,
          chain: new Blockchain().chain
        });

        expect(calculateBalanceMock).toHaveBeenCalled();
        Wallet.calculateBalance = originalCalculateBalance;
      });
    });
  });

  describe('calculateBalance()', () => {
    let blockchain;

    beforeEach(() => {
      blockchain = new Blockchain();
    });

    describe('and there are no outputs for the wallet', () => {
      it('returns the `STARTING_BALANCE`', () => {
        const balance = Wallet.calculateBalance({
          chain: blockchain.chain,
          address: wallet.publicKey
        });

        expect(balance).toEqual(STARTING_BALANCE);
      });
    });

    describe('and there are outputs for the wallet', () => {
      let firstTransaction, secondTransaction;

      beforeEach(() => {
        firstTransaction = new Wallet().createTransaction({
          amount: 50,
          recipient: wallet.publicKey
        });

        secondTransaction = new Wallet().createTransaction({
          amount: 20,
          recipient: wallet.publicKey
        });

        blockchain.addBlock({ data: [firstTransaction, secondTransaction] });
      });

      it('adds the sum of all outputs to the wallet balance', () => {
        const balance = Wallet.calculateBalance({
          chain: blockchain.chain,
          address: wallet.publicKey
        });

        const expectedBalance = STARTING_BALANCE + firstTransaction.outputMap[wallet.publicKey] + secondTransaction.outputMap[wallet.publicKey];

        expect(balance).toEqual(expectedBalance);
      });

      describe('and the wallet has made a transaction', () => {
        let recentTransaction;

        beforeEach(() => {
          recentTransaction = wallet.createTransaction({
            amount: 30,
            recipient: 'foo-recipient'
          });

          blockchain.addBlock({ data: [recentTransaction] });
        });

        it('returns the output amount of the recent transaction', () => {
          const balance = Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey
          });

          expect(balance).toEqual(recentTransaction.outputMap[wallet.publicKey]);
        });

        describe('and there are outputs next to and after the recent transaction', () => {
          let sameBlockTransaction, nextBlockTransaction;

          beforeEach(() => {
            recentTransaction = wallet.createTransaction({
              amount: 30,
              recipient: 'foo-recipient'
            });

            sameBlockTransaction = Transaction.rewardTransaction({ minerWallet: wallet });

            blockchain.addBlock({ data: [recentTransaction, sameBlockTransaction] });

            nextBlockTransaction = new Wallet().createTransaction({
              amount: 50,
              recipient: wallet.publicKey
            });

            blockchain.addBlock({ data: [nextBlockTransaction] });
          });

          it('includes the output amount in the returned balance', () => {
            const balance = Wallet.calculateBalance({
              chain: blockchain.chain,
              address: wallet.publicKey
            });

            const expectedBalance = 
              recentTransaction.outputMap[wallet.publicKey] + sameBlockTransaction.outputMap[wallet.publicKey] + nextBlockTransaction.outputMap[wallet.publicKey];

            expect(balance).toEqual(expectedBalance);
          });
        });
      });
    });
  });
})