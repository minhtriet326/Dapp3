import "@nomicfoundation/hardhat-toolbox";
import * as dotevn from "dotenv";
dotevn.config({ path: __dirname + "/.env" })

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",

  networks: {
    bsctest: {
      url: "https://data-seed-prebsc-2-s2.binance.org:8545",
      accounts: [process.env.PRIV_KEY]
    }
  },

  etherscan: {
    apiKey: process.env.API_KEY
  }
};
