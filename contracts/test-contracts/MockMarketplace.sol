// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IRoyaltyEngineV1} from "@manifoldxyz/royalty-registry-solidity/contracts/IRoyaltyEngineV1.sol";

contract MockMarketplace {
    IRoyaltyEngineV1 royaltyEngine;

    constructor(address _royaltyEngine) {
        royaltyEngine = IRoyaltyEngineV1(_royaltyEngine);
    }

    function distributeRoyaltyEIP2981(uint256 erc20TokenAmount,IERC20 erc20Contract, IERC2981 NFTContract, uint256 NFTId, address NFTBuyer ) external payable {
        if(msg.value == 0) {
            require(erc20TokenAmount > 0, "erc20 token ammount can't be zero");
            (address royaltyReceiver, uint256 value) = NFTContract.royaltyInfo(NFTId,erc20TokenAmount);
            erc20Contract.transferFrom(NFTBuyer, royaltyReceiver, value);
        } else {
            (address royaltyReceiver, uint256 value) = NFTContract.royaltyInfo(NFTId,msg.value);
            (bool sent,) = royaltyReceiver.call{value:value}("");   
            require(sent, "Failed to send distributeRoyaltyEIP2981Ether");
        }
    }

    function distributeRoyaltyRoyaltyEngine(uint256 erc20TokenAmount,IERC20 erc20Contract, IERC2981 NFTContract, uint256 NFTId, address NFTBuyer) external payable{
        if(msg.value == 0) {
            require(erc20TokenAmount > 0, "erc20 token ammount can't be zero");
            (address payable[] memory recipients, uint256[] memory amounts) = royaltyEngine.getRoyalty(address(NFTContract), NFTId, erc20TokenAmount);
            for(uint256 i; i < recipients.length; i++){
                erc20Contract.transferFrom(NFTBuyer, recipients[i], amounts[i]);
            }
        } else {
            (address payable[] memory recipients, uint256[] memory amounts) = royaltyEngine.getRoyalty(address(NFTContract), NFTId, msg.value);
            for(uint256 i; i < recipients.length; i++){
                (bool sent,) = recipients[i].call{value:amounts[i]}("");   
                require(sent, "Failed to send Ether");
            }
        }
    }
}