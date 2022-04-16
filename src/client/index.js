import React from 'react';
import { render } from 'react-dom';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import history from './history';
import App from './components/App';
import Blocks from './components/Blocks';
import CreateTransaction from './components/CreateTransaction';
import TransactionPool from './components/TransactionPool';
import './index.css';

render(
  <BrowserRouter location={history.location} navigator={history}>
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='/blocks' element={<Blocks />} />
      <Route path='/create-transaction' element={<CreateTransaction />} />
      <Route path='/transaction-pool' element={<TransactionPool />} />
    </Routes>
  </BrowserRouter>,
  document.getElementById('root')
);