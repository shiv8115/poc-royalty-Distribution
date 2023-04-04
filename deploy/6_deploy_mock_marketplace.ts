import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();
  const RoyaltyEngineV1 = await deployments.get('RoyaltyEngineV1');

  await deploy('MockMarketplace', {
    from: deployer,
    contract: 'MockMarketplace',
    skipIfAlreadyDeployed: true,
    args: [RoyaltyEngineV1.address],
    log: true,
  });
};
export default func;
func.tags = ['MockMarketplace'];
func.dependencies = ['RoyaltyEngineV1']
