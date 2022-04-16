import 'regenerator-runtime/runtime'
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'

class App extends Component {
  state = {
    walletInfo: {}
  };

  componentDidMount() {
    fetch(`${document.location.origin}/api/wallet-info`)
      .then(async (response) => {
        const data = await response.json();
        this.setState({
          walletInfo: data
        })
      });
  }

  render() {
    const { address, balance } = this.state.walletInfo;

    return (
      <div className="app">
        <img className="logo" src={logo}></img>
        <br />
        <div>
          Welcome to the blockchain...
        </div>
        <br />
        <div><Link to='/blocks'>Blocks</Link></div>
        <div><Link to='/create-transaction'>Create Transaction</Link></div>
        <div><Link to='/transaction-pool'>Transaction Pool</Link></div>
        <br />
        <div className="wallet-info">
          <div>Address: { address }</div>
          <div>Balance: { balance }</div>
        </div>
        <br />
      </div>
    );
  }
}

export default App;