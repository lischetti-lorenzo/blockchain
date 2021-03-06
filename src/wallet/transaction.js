const uuid = require('uuid').v1;
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../../config');

class Transaction {
  constructor({ senderWallet, recipient, amount, outputMap, input }) {
    this.id = uuid();
    this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
    this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  static validTransaction(transaction) {
    const { input: { address, amount, signature } , outputMap } = transaction;
    const outputTotal = Object.values(outputMap).reduce((total, outputAmount) => +total + +outputAmount);

    if (amount !== outputTotal) {
      console.error(`Ìnvalid transaction from ${address}`);
      return false;
    }

    if(!verifySignature({ publicKey: address, data: outputMap, signature: signature})) {
      console.error(`Ìnvalid signature from ${address}`);
      return false;
    }

    return true;
  }

  static rewardTransaction({ minerWallet }) {
    return new Transaction({
      input: REWARD_INPUT,
      outputMap: {
        [minerWallet.publicKey]: MINING_REWARD
      }
    });
  }

  createOutputMap({ senderWallet, recipient, amount }) {
    const outputMap = {};

    outputMap[recipient] = amount;
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

    return outputMap;
  }

  createInput({ senderWallet, outputMap }) {
    return {
      timestamp: Date.now(),
      address: senderWallet.publicKey,
      amount: senderWallet.balance,
      signature: senderWallet.sign(outputMap)
    };
  }

  update({ senderWallet, recipient, amount }) {
    if (amount > this.outputMap[senderWallet.publicKey]) throw new Error('Amount exceeds the balance');
    this.outputMap[recipient] = (this.outputMap[recipient] || 0) + amount;
    this.outputMap[senderWallet.publicKey] -= amount;
    this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
  }
}

module.exports = Transaction;