import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();
  const FallbackRegistry = await deployments.get('FallbackRegistry');

  await deploy('RoyaltyEngineV1', {
    from: deployer,
    contract: 'RoyaltyEngineV1',
    args : [FallbackRegistry.address],
    skipIfAlreadyDeployed: true,
    log: true,
  });
};
export default func;
func.tags = ['RoyaltyEngineV1'];
func.dependencies = ['RoyaltyRegistry','FallbackRegistry']
