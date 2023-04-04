// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// @author: manifold.xyz

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IRoyaltySplitter, Recipient} from "@manifoldxyz/royalty-registry-solidity/contracts/overrides/IRoyaltySplitter.sol";

/**
 * Multi-receiver EIP2981 reference override implementation
 */
interface IMultiReceiverRoyaltyOverrideCore is IERC165 {
    event TokenRoyaltyRemoved(uint256 tokenId);
    event TokenRoyaltySet(
        uint256 tokenId,
        uint16 royaltyBPS,
        address Recipient
    );
    event DefaultRoyaltyBpsSet(uint16 royaltyBPS);

    event DefaultRoyaltyReceiverSet(address recipient);

    event RoyaltyRecipientSet(address splitter, address recipient);

    struct TokenRoyaltyConfig {
        uint256 tokenId;
        uint16 royaltyBPS;
        Recipient[] recipients;
    }

    /**
     * @dev Set per token royalties.  Passing a recipient of address(0) will delete any existing configuration
     */
    function setTokenRoyalties(
        uint256 tokenId,
        uint16 royaltyBPS,
        address payable recipient,
        address creator
    ) external;

    /**
     * @dev Get all token royalty configurations
     */
    function getTokenRoyalties()
        external
        view
        returns (TokenRoyaltyConfig[] memory);

    /**
     * @dev Get the default royalty
     */
    function getDefaultRoyalty()
        external
        view
        returns (uint16 bps, Recipient[] memory);

    /**
     * @dev Set a default royalty e.  Will be used if no token specific configuration is set
     */
    function setDefaultRoyaltyBps(uint16 bps) external;

    function setDefaultRoyaltyReceiver(
        address payable defaultReceiver
    ) external;

    /**
     * @dev Helper function to get all splits contracts
     */
    function getAllSplits() external view returns (address payable[] memory);
}
