import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  await deploy('FallbackRegistry', {
    from: deployer,
    contract: 'FallbackRegistry',
    args : [deployer],
    log: true,
    skipIfAlreadyDeployed: true,
  });
};
export default func;
func.tags = ['FallbackRegistry'];
