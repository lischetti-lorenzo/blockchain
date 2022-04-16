import 'regenerator-runtime/runtime'
import React, { useState } from 'react';
import { FormGroup, FormControl, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const CreateTransaction = () => {
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(0);

  const createTransaction = async () => {
    try {
      const response = await fetch(`${document.location.origin}/api/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, amount })
      });

      const json = await response.json(); 
      alert(json.message || json.type);
      navigate('/transaction-pool');
    } catch (error) {
      console.log('Error: ', error);
    }
  }

  return (
    <div className="create-transaction">
      <div><Link to='/'>Home</Link></div>
      <h3>Create a Transaction</h3>
      <FormGroup>
        <FormControl
          input='text'
          placeholder='Recipient'
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
        />
      </FormGroup>
      <FormGroup>
      <FormControl
          input='number'
          placeholder='Amount'
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </FormGroup>

      <div>
        <Button
          variant="danger"
          onClick={createTransaction}
        >
          Submit
        </Button>
      </div>
    </div>
  )
}

export default CreateTransaction;