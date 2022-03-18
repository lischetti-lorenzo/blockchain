const redis = require('redis');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN'
}

class PubSub {
  constructor({ blockchain }) {
    this.blockchain = blockchain;

    this.publisher = redis.createClient();
    this.subscriber = redis.createClient();

    this.publisher.connect();
    this.subscriber.connect();

    this.subscribeToChannels();
  }

  handleMessage(message, channel) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`);
    const parsedMessage = JSON.parse(message);

    if (channel === CHANNELS.BLOCKCHAIN) {
      this.blockchain.replaceChain(parsedMessage);
    }
  }

  subscribeToChannels() {
    Object.values(CHANNELS).forEach(channel => {
      this.subscriber.subscribe(channel, (message, channel) => this.handleMessage(message, channel));
    })
  }

  async publish({ channel, message }) {
    await this.subscriber.unsubscribe(channel);
    await this.publisher.publish(channel, message);
    await this.subscriber.subscribe(channel, (message, channel) => this.handleMessage(message, channel));
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }
}

module.exports = PubSub;