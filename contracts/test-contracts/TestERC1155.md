# TestERC1155 Contract

This contact was made to test the MultiReceiverRoyaltyOverrideCore. It import the MultiReceiverRoyaltyOverrideCore so that a splitter can be deployed when a creator first mint a NFT and for further NFTs it uses the same splitter to receive his share of royalty.

## functions

```Solidity
    function initialize(
        address payable royaltySplitterCloneable,
        uint16 defaultBps,
        address payable defaultRecipient,
        address _manager
    ) external initializer
```

- initialize to be called by the proxy
- `royaltySplitterCloneable`: The address of the splitter contract to be cloned.
- `defaultBps`: The default ERC2981 royalty basis points (BPS), where 1 BPS is equal to 0.01%.
- `defaultRecipient`: The default recipient of ERC2981 royalties
- `_manager`: The address of the Manager contract for the common royalty recipient.

---

```Solidity
function mint(
        address to,
        uint256 id,
        uint256 amount,
        address payable royaltyRecipient,
        bytes memory data
    ) external
```

- This function mint a single ERC1155 token and set royalty information for the creator
- `to`: Address of the token owner
- `id`: ID of the token to be minted.
- `amount`: Amount of the token to be minted
- `royaltyRecipient`: The royalty recipient for the creator
- `data`: Additional data for minting

---

```Solidity
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        address payable royaltyRecipient,
        bytes memory data
    ) external
```

- This Function used to mint multiple ERC1155 tokens in a batch and set royalty information for the creator for each token.
- `to`: Address of the token owner
- `ids`: Array of IDs of the tokens to be minted
- `amounts`: Array of the amounts of tokens to be minted
- `royaltyRecipient`: The royalty recipient for the creator
- `data`: Additional data for minting

---

```Solidity
    function setTokenRoyalties(
        uint256 tokenId,
        uint16 royaltyBPS,
        address payable recipient,
        address creator
    ) external override onlyOwner
```

- This function used to set royalty information for a specific ERC1155 token.
- `tokenId`: ID of the token to set royalty information for.
- `royaltyBPS`: Royalty basis points (BPS) to set for the token
- `recipient`: Address of the royalty recipient for the splitter of the creator
- `creator`: Address of the creator of the token
- This function should not be called in our use case.

---

```Solidity
    function setRoyaltyRecipient(address payable recipient) external
```

- This function used to set the royalty recipient for a creator to receive royalty payments.
- This function should be called by the creator's wallet
- `recipient`: Address of the new wallet to receive royalty payments

---

```Solidity
    function setDefaultRoyaltyBps(
        uint16 bps
    ) external override onlyOwner
```

- This function used to set the default royalty basis points (BPS) to be used for EIP2981
- This function can only be called by the contract owner
- `bps`: Royalty basis points (BPS) to set as default (base 10000).

---

```Solidity
    function setDefaultRoyaltyReceiver(
        address payable defaultReceiver
    ) external onlyOwner
```

- This function used to set the default royalty recipient to be used for EIP2981.
- `defaultReceiver`: Address of the default royalty recipient.
