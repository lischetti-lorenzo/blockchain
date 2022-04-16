import 'regenerator-runtime/runtime';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Transaction from './Transaction';

const POLL_INTERVAL_MS = 10000;

class TransactionPool extends Component {
  state = {
    transactionPoolMap: {}
  };

  fetchTransactionsPoolMap = async () => {
    const response = await fetch(`${document.location.origin}/api/transaction-pool`);
    const json = await response.json();
    this.setState({ transactionPoolMap: json });
  }

  fetchMineTransactions = async () => {
    const response = await fetch(`${document.location.origin}/api/mine-transactions`);
    console.log('Response: ', response);
    if (response.status === 200) {
      alert('success');
      this.fetchTransactionsPoolMap();
    } else {
      alert('The mine-transactions block request did not complete.')
    }
  }

  componentDidMount() {
    this.fetchTransactionsPoolMap();
    this.fetchTransactionPoolInterval = setInterval(() => this.fetchTransactionsPoolMap(), POLL_INTERVAL_MS);
  }

  componentWillUnmount() {
    clearInterval(this.fetchTransactionPoolInterval);
  }

  render() {
    return (
      <div className="transaction-pool">
        <div><Link to='/'>Home</Link></div>
        <h3>Transaction Pool</h3>
        {
          Object.values(this.state.transactionPoolMap).map(transaction => {
            return (
              <div key={transaction.id}>
                <hr />
                <Transaction transaction={transaction} />
              </div>
            )
          })
        }
        <hr />
        <Button
          variant="danger"
          onClick={this.fetchMineTransactions}
        >
          Mine the Transactions
        </Button>
      </div>
    )
  }
}

export default TransactionPool;