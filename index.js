const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const Blockchain = require('./src/blockchain/blockchain');
const PubSub = require('./src/app/pubsub');

const app = express();
const blockchain = new Blockchain();
const pubsub = new PubSub({ blockchain });
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
let PEER_PORT;

app.use(bodyParser.json());

app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data });
  pubsub.broadcastChain();

  res.redirect('/api/blocks');
});

const syncChains = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
    if (error) {
      console.error('Error when syncChains: ', error);
      return;
    }

    if (response.statusCode === 200) {
      const rootChain = JSON.parse(body);

      console.log('Replace chain on a sync with: ', rootChain);
      blockchain.replaceChain(rootChain);
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
    syncChains();
  }
})