# Manager

Manager contract stores the common royalty recipient so the splitters can read it. it also stores the royalty split for the common royalty splitter so that the EIP2981 Royalty is divided between the creator and the common royalty recipient.

Common recipient gets commonSplit/Total_Total_Base_Points part of the royalty and creator get (Total_Total_Base_Points - commonSplit)/Total_Total_Base_Points part of the royalty.

This contract also stores the EIP2981 RoyaltyBps for the contact's which don't use Splitters for royalty distribution.

## External functions

```Solidity
    function initialize(
        address payable _commonRecipient,
        uint16 _commonSplit
    ) external initializer
```

- Initialization function for deploying the contract via a proxy
- This function is called during deployment and sets the common recipient and split for all the splitters.
- ` _commonRecipient`: The common recipient wallet address for all the splitters
- `_commonSplit` The split percentage for the common recipient and creators split would be 10000 - commonSplit

---

```Solidity
    function setSplit(
        uint16 _commonSplit
    ) external override onlyOwner
```

- Sets the common split Bps for the common recipient
- `_commonSplit`: The new common split percentage to be set
- emits `RecipientSet` event.

---

```Solidity
    function setContractRoyalty(
        address contractAddress,
        uint16 _royaltyBps
    ) external onlyOwner
```

- This function sets the royalty split percentage for a specific contract according to the EIP 2981 standard.
- `contractAddress`: The address of the contract for which the royalty split percentage is being set
- `_royaltyBps`: The new royalty split percentage to be set for the specified contract
- Emits `RoyaltySet` event.

---

```Solidity
    function getCommonRecipient()
        external
        view
        override
        returns (Recipient memory recipient)
```

- This function returns the common recipient and split to be used by the splitters
- return `recipient` A Recipient struct containing the common recipient and split information.

---

```Solidity
function setRecipient(
        address payable _commonRecipient
    ) external override onlyOwner
```

- Sets the common recipient wallet address for all the splitters
- This function can only be called by the contract owner (or later by a manager)
- `_commonRecipient`: The new common recipient wallet address to be set

---

```Solidity
function getCreatorSplit() external view returns (uint16)
```

- This function returns the creator split to be used by the splitters
- return `creatorSplit` An unsigned integer representing the creator split

---

```Solidity
function getRoyaltyInfo() external view returns (address, uint16)
```

- This function returns the common recipient and EIP2981 royalty split for the caller contract
- External function to retrieve information on the common recipient and EIP2981 royalty split for a given contract
- returns EIP

---

```Solidity
    function _setRecipient(
        address payable _commonRecipient
    ) internal
```

- This function sets the common recipient for all the splitters
- `_commonRecipient`: the common recipient for all the splitters
- emits `RecipientSet` event.

---

```Solidity
    function _setSplit(
        uint16 _commonSplit
    ) internal
```

- This function sets the common recipient and common split
- `_commonSplit`: split for the common recipient and creators split would be 10000 - `_commonSplit`
- emits `SplitSet` event.

---

## Events

Events that are emitted through the lifetime of the contract

---

```Solidity
    event RecipientSet(address commonRecipient);
```

- Event emitted when common recipient is set.
- emitted when \_setRecipient is called.
- `commonRecipient`: The wallet address of the commonRecipient.

---

---

```Solidity
    event SplitSet(uint16 commonSplit);
```

- Event emitted when common split is set.
- emitted when \_setSplit is called.
- `commonSplit`: The common recipients split of royalty in bps.

---

---

```Solidity
    event RoyaltySet(uint16 royaltyBps, address contractAddress);
```

- Event emitted when EIP2981 Royalty bps is set for a contract.
- emitted when setContractRoyalty is called.
- `royaltyBps`: Royalty Bps.
- `contractAddress`: Contract address for which the royalty is set.

---
