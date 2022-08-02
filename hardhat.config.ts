import { HardhatUserConfig } from "hardhat/config";
import  "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.PRIVATE_KEY || '';

const config: HardhatUserConfig = {
  solidity: "0.8.12",
  mocha: {
    timeout: 4000000,
  },
  networks: {
    mumbai: {
      url: 'https://rpc-mumbai.matic.today/',
      accounts: [privateKey],
      chainId: 80001,
    }  
  }
};

export default config;
