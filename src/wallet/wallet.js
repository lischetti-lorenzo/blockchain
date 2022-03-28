const Transaction = require('./transaction');
const { STARTING_BALANCE } = require('../../config');
const { ec } = require('../util');
const cryptoHash = require('../util/crypto-hash');

class Wallet {
  constructor() {
    this.balance = STARTING_BALANCE;

    this.keyPair = ec.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode('hex');
  }

  static calculateBalance({ chain, address }) {
    let hasConductedTransaction = false;
    let balance = 0;
    for (let i = chain.length - 1; i > 0 && !hasConductedTransaction; i--) {
      const block = chain[i];
      
      for (let transaction of block.data) {
        if (transaction.input.address === address) hasConductedTransaction = true;

        if (transaction.outputMap[address]) {
          balance += transaction.outputMap[address];
        }
      }
    }

    return hasConductedTransaction ? balance : balance + STARTING_BALANCE;
  }

  sign(data) {
    return this.keyPair.sign(cryptoHash(data));
  }

  createTransaction({ amount, recipient, chain }) {
    if (chain) {
      this.balance = Wallet.calculateBalance({
        address: this.publicKey,
        chain
      });
    }

    if (amount > this.balance) throw new Error('Amount exceeds the balance');
    
    return new Transaction({ recipient, amount, senderWallet: this});
  }
}

module.exports = Wallet;