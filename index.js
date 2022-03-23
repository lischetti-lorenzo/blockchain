const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const Blockchain = require('./src/blockchain/blockchain');
const PubSub = require('./src/app/pubsub');
const TransactionPool = require('./src/wallet/transaction-pool');
const Wallet = require('./src/wallet/wallet');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const pubsub = new PubSub({ blockchain, transactionPool });
const wallet = new Wallet();

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
let PEER_PORT;

app.use(bodyParser.json());

app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain);
});

app.get('/api/transaction-pool', (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.post('/api/mine', (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data });
  pubsub.broadcastChain();

  res.redirect('/api/blocks');
});

app.post('/api/transaction', (req, res) => {
  const { amount, recipient } = req.body;
  let transaction = transactionPool.existingTransaction({ inputAddress: wallet.publicKey });

  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, amount, recipient });      
    } else {
      transaction = wallet.createTransaction({ amount, recipient });
    }
  } catch (err) {
    return res.status(400).json({ type: 'error', message: err.message });
  }

  transactionPool.setTransaction(transaction);
  pubsub.broadcastTransaction(transaction);

  res.json({ type: 'success', transaction });
});

const syncRootState = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
    if (error) {
      console.error('Error when sync chains: ', error);
      return;
    }

    if (response.statusCode === 200) {
      const rootChain = JSON.parse(body);

      console.log('Replace chain on a sync with: ', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });

  request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool` }, (error, response, body) => {
    if (error) {
      console.error('Error when sync transaction pool: ', error);
      return;
    }

    if (response.statusCode === 200) {
      const rootTransactionPoolMap = JSON.parse(body);

      console.log('Replace transaction pool map on a sync with: ', rootTransactionPoolMap);
      transactionPool.setMap(rootTransactionPoolMap);
    }
  })
};

if(process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`Server started at localhost ${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    syncRootState();
  }
})