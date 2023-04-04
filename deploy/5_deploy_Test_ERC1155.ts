import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer, royaltyReceiver} = await getNamedAccounts();

  const customSplitter = await deployments.get('CustomRoyaltySplitter');
  const Manager = await deployments.get('Manager');


  await deploy('TestERC1155', {
    from: deployer,
    contract: 'TestERC1155',
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initialize',
      args: [customSplitter.address, 300, royaltyReceiver,Manager.address],
      },
      upgradeIndex: 0,
    },
    log: true,
    skipIfAlreadyDeployed: true,
  });
};
export default func;
func.tags = ['TestERC1155'];
func.dependencies = ['CustomRoyaltySplitter','Manager'];
