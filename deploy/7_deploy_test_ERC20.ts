import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  await deploy('TestERC20', {
    from: deployer,
    contract: 'TestERC20',
    skipIfAlreadyDeployed: true,
    args: ["TestERC20","T"],
    log: true,
  });
};
export default func;
func.tags = ['TestERC20'];