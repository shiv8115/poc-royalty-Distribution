import { HardhatUserConfig } from "hardhat/config";
import 'hardhat-deploy';
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
    user: 1,
    seller: 2,
    buyer: 3,
    commonRoyaltyReceiver: 4,
    royaltyReceiver:5,
    commonRoyaltyReceiver2 : 6,
    zeroAddress : '0x0000000000000000000000000000000000000000'
  }
};

export default config;
