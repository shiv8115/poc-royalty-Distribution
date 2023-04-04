import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer,zeroAddress} = await getNamedAccounts();

  await deploy('RoyaltyRegistry', {
    from: deployer,
    contract: 'RoyaltyRegistry',
    args : [zeroAddress],
    skipIfAlreadyDeployed: true,
    log: true,
  });
};
export default func;
func.tags = ['RoyaltyRegistry'];
