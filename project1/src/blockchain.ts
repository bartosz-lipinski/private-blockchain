/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

import { Block } from './block';
import { getCurrentTime, MINUTE } from './utils';
import bitcoinMessage from 'bitcoinjs-message';

export class Blockchain {
  private height: number = -1;
  private chain: Block[] = [];

  /**
   * Constructor of the class, you will need to setup your chain array and the height
   * of your chain (the length of your chain array).
   * Also everytime you create a Blockchain class you will need to initialized the chain creating
   * the Genesis Block.
   * The methods in this class will always return a Promise to allow client applications or
   * other backends to call asynchronous functions.
   */
  constructor() {
    this.initializeChain();
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   * You should use the `addBlock(block)` to create the Genesis Block
   * Passing as a data `{data: 'Genesis Block'}`
   */
  public async initializeChain() {
    if (this.height === -1) {
      let block = new Block({ data: 'Genesis Block' });
      await this._addBlock(block);
    }
  }

  /**
   * Utility method that return a Promise that will resolve with the height of the chain
   */
  public getChainHeight =  async () => {
    return this.height;
  }

  public getLatestBlock(): Block {
    return this.chain[this.chain.length -1];
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block 
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   * You will need to check for the height to assign the `previousBlockHash`,
   * assign the `timestamp` and the correct `height`...At the end you need to 
   * create the `block hash` and push the block into the chain array. Don't for get 
   * to update the `this.height`
   * Note: the symbol `_` in the method name indicates in the javascript convention 
   * that this method is a private method. 
   */
  private _addBlock = async (block: Block) => {
    let self = this;
    const NEW_HEIGHT = (await this.getChainHeight()) + 1;
    block.height = NEW_HEIGHT;
    block.time = getCurrentTime();
    if (NEW_HEIGHT > 0) {
      block.previousBlockHash = self.getLatestBlock().hash;
    }

    block.hash = block.computeHash();
    self.chain.push(block);
    this.height = NEW_HEIGHT;
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address 
   */
  public requestMessageOwnershipVerification = async (address: string) => {
    return `${address}:${getCurrentTime()}:starRegistry`;
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   * Algorithm steps:
   * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
   * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
   * 3. Check if the time elapsed is less than 5 minutes
   * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
   * 5. Create the block and add it to the chain
   * 6. Resolve with the block added.
   * @param {*} address 
   * @param {*} message 
   * @param {*} signature 
   * @param {*} star 
   */
  public submitStar = async (address: string, message: any, signature: any, star: any) => {
    const time = parseInt(message.split(':')[1]);
    let currentTime = getCurrentTime();

    if((time + (5 * 60)) < currentTime) {
      throw new Error('Rejecting old request');
    }

    if (!bitcoinMessage.verify(message, address, signature)) {
      throw new Error('Invalid sigunutre');
    }

    const block = new Block({ owner: address, star });
    await this._addBlock(block);
    
    return block;
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * Search on the chain array for the block that has the hash.
   * @param {*} hash 
   */
  public getBlockByHash = async (hash: string) => {
    return this.chain.filter(p => p.hash === hash)[0];  
  }

  /**
   * This method will return a Promise that will resolve with the Block object 
   * with the height equal to the parameter `height`
   * @param {*} height 
   */
  public getBlockByHeight = async (height: number) => {
    return this.chain.filter(p => p.height === height)[0];
  }

  /**
   * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
   * and are belongs to the owner with the wallet address passed as parameter.
   * Remember the star should be returned decoded.
   * @param {*} address 
   */
  public getStarsByWalletAddress = async (address: string) => {
    return this.chain
      .map(block => block.getBData())
      .filter(data => data && data.owner === address);
  }

  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   * Steps to validate:
   * 1. You should validate each block using `validateBlock`
   * 2. Each Block should check the with the previousBlockHash
   */
  public validateChain = async () => {
    const errorLog: string[] = [];
    const promises: Promise<boolean>[] = [];
    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      promises.push(block.validate());

      if(block.height <= 0) {
        continue;
      }

      const prevBlock = this.chain[i-1];
      if(prevBlock.hash !== block.previousBlockHash) {
        errorLog.push(`Error hash mismatch for block at height: ${this.chain[i].height}.`);
      }
    }

    const results = await Promise.all(promises);

    for (let i = 0; i < results.length; i++) {
      const isValid = results[i];
      if(!isValid) {
        errorLog.push(`Error invalid block at height: ${this.chain[i].height}`);
      }
    }

    return errorLog;
  }
}
