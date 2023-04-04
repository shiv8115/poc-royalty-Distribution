// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {IManager} from "../interfaces/IManager.sol";

contract Catalyst is ERC1155Upgradeable {
    IManager manager;

    /// @notice initiliaze to be called by the proxy
    /// @dev would run once.
    /// @param _manager, the address of the Manager contract for common royalty recipient
    function initialize(address _manager) external initializer {
        manager = IManager(_manager);
    }

    function getRoyaltyInfo() external view returns (address, uint16) {
        (address receiver, uint16 royaltyBps) = manager.getRoyaltyInfo();
        return (receiver, royaltyBps);
    }
}
