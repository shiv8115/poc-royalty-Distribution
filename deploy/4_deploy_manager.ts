import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const customSplitter = await deployments.get('CustomRoyaltySplitter');
  const { deployer, commonRoyaltyReceiver } = await getNamedAccounts();

  await deploy("Manager", {
    from: deployer,
    contract: "Manager",
    proxy: {
      owner: deployer,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [customSplitter.address, commonRoyaltyReceiver, 5000],
      },
      upgradeIndex: 0,
    },
    log: true,
    skipIfAlreadyDeployed: true,
  });
};
export default func;
func.tags = ["Manager"];
