# CustomSplitter

Implementing a cloneable and configurable royalty splitter. It allows for the distribution of royalties from NFT sales among 2 recipients. First recipient is the creator's wallet and the second recipient is common recipient in the manager.sol contract.

This contract calls the manager contract to for the common recipient address, common recipients split of the Royalty and creators share of the royalty. Just the creators wallet address is set here.

## functions

```Solidity
    function initialize(
        address payable recipient,
        address manager
    ) public initializer
```

- Initializes the contract after its initial deployment by setting the recipient wallet address and manager contract's addresses
- `recipient`: The address of the recipient of the funds
- `manager`: The address of the manager contract

---

```Solidity
    function setRecipients(
        Recipient[] calldata recipients
    ) external override onlyOwner
```

- This function used to set the recipients wallet address. but not the split. This is done to be in compliance with the splitter interface of manifolds.
- `recipients`: The array of recipients to be set.

---

```Solidity
    function getRecipients()
        external
        view
        override
    returns (Recipient[] memory)
```

- Retrieves an array of recipients of the funds from this contractAddress
- `return` An array of Recipient , each containing an address and a BPS value representing the share of the funds they receive in the address.

---

```Solidity
    function splitETH() public
```

- Allows any ETH stored by the contract to be split among recipients
- Normally ETH is forwarded as it comes.
- Could only be called by the one of the recipient(creator or common recipient)

---

```Solidity
    function proxyCall(
        address payable target,
        bytes calldata callData
    ) external
```

- Allows the split recipients to make an arbitrary contract call
- This is provided to allow recovering from unexpected scenarios, such as receiving an NFT at this address.
- It will first attempt a fair split of ERC20 tokens before proceeding.
- This contract is built to split ETH payments. The ability to attempt to make other calls is here just in case other assets were also sent so that they don't get locked forever in the contract.

---

```Solidity
function splitERC20Tokens(IERC20 erc20Contract) public
```

- This function allows recipients to split all available tokens at the provided address between themselves
- recipients(both creator and common) can only call this function to split all available tokens at the provided address between the recipients.
- `erc20Contract`: The ERC20 token contract to split

---

## Events

```Solidity
    event ETHTransferred(address indexed account, uint256 amount)
```

- Emitted when ETH is transferred
- `account` The address of the account that transferred the ETH
- `amount` The amount of ETH transferred

---

```Solidity
    event ERC20Transferred(
        address indexed erc20Contract,
        address indexed account,
        uint256 amount
    );
```

- Emitted when an ERC20 token transfer occurs
- `erc20Contract`: The address of the ERC20 contract that emitted the event.
- `account`: The address of the account that transferred the tokens
- `amount`: The amount of tokens transferred

---
