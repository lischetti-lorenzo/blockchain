const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet/wallet');
const cryptoHash = require('../util/crypto-hash');
const { REWARD_INPUT, MINING_REWARD } = require('../../config');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let i=1; i < chain.length; i++) {
      const { timestamp, lastHash, data, hash, difficulty, nonce } = chain[i];
      const lastDifficulty = chain[i-1].difficulty;

      if (lastHash !== chain[i-1].hash) return false;
      if (Math.abs(lastDifficulty - difficulty) > 1) return false;

      const validHash = cryptoHash(lastHash, data, timestamp, nonce, difficulty);
      if (validHash !== hash) return false;
    }

    return true;
  }

  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data
    });

    this.chain.push(newBlock);
  }

  replaceChain(newChain, onSuccess) {
    if (newChain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');
      return
    };

    if (!Blockchain.isValidChain(newChain)) {
      console.error('The incoming chain must be valid');
      return
    };

    if (!this.validTransactionData({ chain: newChain })) {
      console.error('The incoming chain has invalid data');
      return
    }

    if (onSuccess) onSuccess();
    console.log('Replacing chain with: ', newChain);
    this.chain = newChain;
  }

  validTransactionData({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount++;

          if (rewardTransactionCount > 1) {
            console.error('Miner rewards exceeds limit');
            return false;
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amount is invalid');
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {            
            console.error('Invalid transaction');
            return false;
          }

          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address
          });

          if (trueBalance !== transaction.input.amount) {
            console.error('Invalid input amount');
            return false;
          }

          if (transactionSet.has(transaction)) {
            console.error('An identical transaction appears more than once in the blockchain');
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }

    return true;
  }
}

module.exports = Blockchain;