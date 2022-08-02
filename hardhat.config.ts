import { HardhatUserConfig } from "hardhat/config";
import  "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.PRIVATE_KEY || '';
const mumbaiKey = process.env.MUMBAI_API || '';
const mumbaiUrl = process.env.MUMBAI_URL || '';

const config: HardhatUserConfig = {
  solidity: "0.8.12",
  mocha: {
    timeout: 4000000,
  },
  networks: {
    mumbai: {
      url: mumbaiUrl,
      accounts: [privateKey],
      chainId: 80001,
    }  
  },
  etherscan: {
    apiKey: mumbaiKey,
  }
};

export default config;
