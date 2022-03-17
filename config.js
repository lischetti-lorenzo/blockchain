const MINE_RATE = 1000; // 1 second
const INITIAL_DIFFICULTY = 3;

const GENESIS_DATA = {
  timestamp: 1,
  lastHash: '-------',
  hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  data: []
};

module.exports = { GENESIS_DATA, MINE_RATE };
