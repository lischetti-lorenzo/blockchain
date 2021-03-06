const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const Blockchain = require('./src/blockchain/blockchain');
const PubSub = require('./src/app/pubsub');
const TransactionPool = require('./src/wallet/transaction-pool');
const Wallet = require('./src/wallet/wallet');
const TransactionMiner = require('./src/app/transaction-miner');

const isDevelopment = process.env.ENV === 'development';
const REDIS_URL = isDevelopment ?
  'redis://127.0.0.1:6379' :
  'redis://:p90988090488eb3bb553d2ac90b08ad88f27a0cda7571fcdd7858459e1167a535@ec2-52-86-202-105.compute-1.amazonaws.com:18679';
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
let PEER_PORT;

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const pubsub = new PubSub({ blockchain, transactionPool, redisUrl: REDIS_URL });
const wallet = new Wallet();
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'src', 'client', 'dist')));

app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain);
});

app.get('/api/transaction-pool', (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
  transactionMiner.mineTransactions();
  
  res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
  const address = wallet.publicKey;
  res.json({
    address,
    balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './src/client/dist/index.html'));
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
      transaction = wallet.createTransaction({ amount, recipient, chain: blockchain.chain });
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

if (isDevelopment) {
  const firstWallet = new Wallet();
  const secondWallet = new Wallet();

  const generateWalletTransaction = (wallet, recipient, amount) => {  
    const transaction = wallet.createTransaction({ amount, recipient, chain: blockchain.chain });
    
    transactionPool.setTransaction(transaction);
  }

  const walletAction = () => generateWalletTransaction(wallet, firstWallet.publicKey, 5);
  const firstWalletAction = () => generateWalletTransaction(firstWallet, secondWallet.publicKey, 10);
  const secondWalletAction = () => generateWalletTransaction(secondWallet, wallet.publicKey, 15);

  for (let i = 0; i < 10; i++) {
    if (i%3 === 0) {
      walletAction();
      firstWalletAction();
    } else if (i%3 === 1) {
      walletAction();
      secondWalletAction();
    } else {
      firstWalletAction();
      secondWalletAction();
    }

    transactionMiner.mineTransactions();
  }
}

if(process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`Server started at localhost ${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    syncRootState();
  }
})