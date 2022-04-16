import 'regenerator-runtime/runtime'
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Block from './Block';

class Blocks extends Component {
  state = {
    blocks: []
  }

  async componentDidMount() {
    try {
      const response = await fetch(`${document.location.origin}/api/blocks`);
      const data = await response.json();
      this.setState({ blocks: data });
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    return (
      <div>
        <div><Link to='/'>Home</Link></div>
        <h3>Blocks</h3>
        {
          this.state.blocks.map(block => {
            return (
              <Block key={block.hash} block={block} />
            )
          })
        }
      </div>
    )
  }
}

export default Blocks;