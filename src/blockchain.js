const Block = require('./block');
const cryptoHash = require('./crypto-hash');

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

  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) {
      console.error('The incoming chaing must be longer');
      return
    };

    if (!Blockchain.isValidChain(newChain)) {
      console.error('The incoming chaing must be valid');
      return
    };

    console.log('Replacing chain with: ', newChain);
    this.chain = newChain;
  }
}

module.exports = Blockchain;