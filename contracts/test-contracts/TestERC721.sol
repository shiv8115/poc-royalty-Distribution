// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../MultiReceiverRoyaltyOverrideCore.sol";

/// @title Test ERC721 contract
/// @dev Made to test splitter deployment for each creator
/// Creator could change his royalty receiving Wallet for his splitter through setRoyaltyRecipient function
contract TestERC721 is
    ERC721Upgradeable,
    OwnableUpgradeable,
    MultiReceiverRoyaltyOverrideCore
{
    /// @notice initiliaze to be called by the proxy
    /// @dev would run once.
    /// @param royaltySplitterCloneable the address of splitter contract to be cloned.
    /// @param defaultBps default erc2981 royalty bps.(base 10000)
    /// @param defaultRecipient the default recipient of erv2981 royalty
    /// @param _manager, the address of the Manager contract for common royalty recipient
    function initialize(
        address payable royaltySplitterCloneable,
        uint16 defaultBps,
        address payable defaultRecipient,
        address _manager
    ) external initializer {
        _royaltySplitterCloneable = royaltySplitterCloneable;
        _defaultRoyaltyReceiver = defaultRecipient;
        _defaultRoyaltyBPS = defaultBps;
        manager = _manager;
        __Ownable_init();
    }

    /// @notice function to mint a NFT token
    /// @param to address of the token owner
    /// @param id of the token
    /// @param royaltyRecipient the royalty recipient for the creator
    /// @param data for miniting
    function mint(
        address to,
        uint256 id,
        address payable royaltyRecipient,
        bytes memory data
    ) external {
        _safeMint(to, id, data);
        _setTokenRoyalties(
            id,
            _defaultRoyaltyBPS,
            royaltyRecipient,
            msg.sender
        );
    }

    /// @notice EIP 165 interface funtion
    /// @dev used to check interface implemented
    /// @param interfaceId to be checked for implementation
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(MultiReceiverRoyaltyOverrideCore, ERC721Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Not in our use case
    /// @dev Explain to a developer any extra details
    /// @param tokenId a parameter just like in doxygen (must be followed by parameter name)
    /// @param royaltyBPS should be defult of use case.
    /// @param recipient the royalty recipient for the splitter of the creator.
    /// @param creator the creactor of the tokens.
    function setTokenRoyalties(
        uint256 tokenId,
        uint16 royaltyBPS,
        address payable recipient,
        address creator
    ) external override onlyOwner {
        _setTokenRoyalties(tokenId, royaltyBPS, recipient, creator);
    }

    /// @notice To be called by creator for to change his wallet to receive royalty.
    /// @dev to be called by creator wallet.
    /// @param recipient new wallet to receive royalty.
    function setRoyaltyRecipient(address payable recipient) external {
        _setRoyaltyRecipient(_defaultRoyaltyBPS, recipient, msg.sender);
    }

    /// @notice sets default royalty bps for EIP2981
    /// @dev only owner can call.
    /// @param bps royalty bps base 10000
    function setDefaultRoyaltyBps(uint16 bps) external override onlyOwner {
        _setDefaultRoyaltyBps(bps);
    }

    /// @notice sets default royalty receiver for EIP2981
    /// @dev only owner can call.
    /// @param defaultReceiver address of default royalty recipient.
    function setDefaultRoyaltyReceiver(
        address payable defaultReceiver
    ) external onlyOwner {
        _setDefaultRoyaltyReceiver(defaultReceiver);
    }
}
