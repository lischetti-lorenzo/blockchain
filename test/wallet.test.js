const Wallet = require('../src/wallet/wallet');
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
})