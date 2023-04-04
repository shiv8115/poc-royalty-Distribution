// SPDX-License-Identifier: MIT OR Apache-2.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IManager.sol";
import "./CustomSplitter.sol";
import {IRoyaltySplitter, Recipient} from "@manifoldxyz/royalty-registry-solidity/contracts/overrides/IRoyaltySplitter.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/IMultiReceiverRoyaltyOverrideCore.sol";
// import "./MultiReceiverRoyaltyOverrideCore.sol";
import "hardhat/console.sol";

/// @title Registry
/// @notice Registry contract to set the common Recipient and Split for the splitters. Also to set the royalty info
/// for contract which don't use splitter
contract Manager is OwnableUpgradeable, IManager {
    uint16 internal constant TOTAL_BASIS_POINTS = 10000;
    uint16 public commonSplit;
    address payable public commonRecipient;
    // Address of cloneable splitter contract
    address internal _royaltySplitterCloneable;
    mapping(address => uint16) public contractRoyalty;
    mapping(address => address payable) public _creatorRoyaltiesSplitter;
    /// @notice initialization function for deployment of contract
    /// @dev called during the deployment via the proxy.
    /// @param _commonRecipient the != address(0)common recipient for all the splitters
    /// @param _commonSplit split for the common recipient and creators split would be 10000 - commonSplit
    function initialize(
        address payable royaltySplitterCloneable,
        address payable _commonRecipient,
        uint16 _commonSplit
    ) external initializer {
        _royaltySplitterCloneable = royaltySplitterCloneable;
        _setRecipient(_commonRecipient);
        _setSplit(_commonSplit);
        __Ownable_init();
    }

    /// @notice sets the common recipient and common split
    /// @dev can only be called by the owner now later could be called my a manager
    /// @param _commonRecipient the common recipient for all the splitters
    function setRecipient(
        address payable _commonRecipient
    ) external override onlyOwner {
        _setRecipient(_commonRecipient);
    }

    function returnSplitter(
        uint256 tokenId,
        uint16 royaltyBPS,
        address payable recipient,
        address creator
    ) external returns(address payable){
         address payable creatorSplitterAddress = _creatorRoyaltiesSplitter[
            creator
        ];
        if (creatorSplitterAddress == address(0)) {
            creatorSplitterAddress = payable(
                Clones.clone(_royaltySplitterCloneable)
            );
            CustomRoyaltySplitter(creatorSplitterAddress).initialize(
                recipient,
                address(this)
            );
            _creatorRoyaltiesSplitter[creator] = creatorSplitterAddress;
        }
        return creatorSplitterAddress;
    }

    /// @notice sets the common recipient and common split
    /// @dev can only be called by the owner now later could be called my a manager
    /// @param _commonSplit split for the common recipient and creators split would be 10000 - commonSplit
    function setSplit(uint16 _commonSplit) external override onlyOwner {
        _setSplit(_commonSplit);
    }

    function _setRecipient(address payable _commonRecipient) internal {
        require(
            _commonRecipient != address(0),
            "Can't set common recipient to zero address"
        );
        commonRecipient = _commonRecipient;
        emit RecipientSet(_commonRecipient);
    }

    function _setSplit(uint16 _commonSplit) internal {
        require(
            _commonSplit < TOTAL_BASIS_POINTS,
            "Can't set common recipient to zero address"
        );
        commonSplit = _commonSplit;
        emit SplitSet(_commonSplit);
    }

    /// @notice called to set the EIP 2981 royalty split
    /// @dev can only be called by the owner now later could be called my a manager
    /// @param _royaltyBps the royalty split for the EIP 2981
    function setContractRoyalty(
        address contractAddress,
        uint16 _royaltyBps
    ) external onlyOwner {
        require(
            _royaltyBps < TOTAL_BASIS_POINTS,
            "Royalty can't be greater than Total base points"
        );
        contractRoyalty[contractAddress] = _royaltyBps;
        emit RoyaltySet(_royaltyBps, contractAddress);
    }

    /// @notice to be called by the splitters to get the common recipient and split
    /// @return recipient which has common recipient and split
    function getCommonRecipient()
        external
        view
        override
        returns (Recipient memory recipient)
    {
        recipient = Recipient({recipient: commonRecipient, bps: commonSplit});
        return recipient;
    }

    /// @notice to be called by the splitters to get the common recipient and split
    /// @return creatorSplit which is 10000 - commonSplit
    function getCreatorSplit() external view returns (uint16) {
        return TOTAL_BASIS_POINTS - commonSplit;
    }

    function getCreatorRoyaltiesSplitter(address _addr) external view override returns (address payable) {
        return _creatorRoyaltiesSplitter[_addr];
    }

    /// @notice returns the commonRecipient and EIP2981 royalty split
    /// @return commonRecipient
    /// @return royaltySplit
    function getRoyaltyInfo() external view returns (address, uint16) {
        return (commonRecipient, contractRoyalty[msg.sender]);
    }

    function setRoyaltyRecipient(
        uint16 royaltyBPS,
        address payable recipient,
        address creator
    ) external {
        address payable creatorSplitterAddress = _creatorRoyaltiesSplitter[
            creator
        ];
        require(
            creatorSplitterAddress != address(0),
            "No splitter deployed for the creator"
        );
        address _recipient = CustomRoyaltySplitter(creatorSplitterAddress)
            ._recipient();
        require(_recipient != recipient, "Recipient already set");
        Recipient[] memory newRecipient = new Recipient[](1);
        newRecipient[0] = Recipient({recipient: recipient, bps: royaltyBPS});
        CustomRoyaltySplitter(creatorSplitterAddress).setRecipients(
            newRecipient
        );
    }
}
