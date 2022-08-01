// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import "./interfaces/ISummoner.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract FirstSaleMinter is Initializable {
    function initialize(address summoner_) public initializer {
        summoner = ISummonerUpgradeable(summoner_);
    }

    ISummonerUpgradeable summoner;
    uint16 constant public TOTAL_MINTED = 4000;
    uint16 constant public FEMALE_INDEX_START = 3500;
    uint16 constant public WHITELIST_MINT = 500;
    uint16 constant public PUBLIC_MINT = 3000;
    uint16 constant public MALE_TOKEN = 3500;
    uint16 constant public FEMALE_TOKEN = 500;

    uint16 public publicMinted = 0;
    uint16 public whitelistMinted = 0;

    mapping(uint16 => uint16) private _tokenMaleMatrix;
    mapping(uint16 => uint16) private _tokenFemaleMatrix;

    event PublicMint(address indexed to, uint256 indexed maleId);
    event WhitelistMint(address indexed to, uint256 indexed maleId, uint256 indexed femaleId);

    function publicMint() external {
        require(publicMinted < PUBLIC_MINT, 'publicMint::Exceed');
        uint16 maleId = _mintMale(publicMinted);
        publicMinted++;
        emit PublicMint(msg.sender, maleId);
    }

    function whitelistsMint() external {
        require(whitelistMinted < WHITELIST_MINT, 'whitelistMint::Exceed');
        uint16 maleId =  _mintMale(whitelistMinted);
        uint16 femaleId = _mintFemale(whitelistMinted);
        whitelistMinted++;
        emit WhitelistMint(msg.sender, maleId, femaleId);
    }

    function _mintMale(uint16 minted) internal returns (uint16) {
        uint16 tokenId = _getMaleTokenToBeMinted(minted);
        summoner.mint(msg.sender, tokenId);
        return tokenId;
    }

    function _mintFemale(uint16 minted) internal returns (uint16) {
        uint16 tokenId = _getFemaleTokenToBeMinted(minted) + FEMALE_INDEX_START;
        summoner.mint(msg.sender, tokenId);
        return tokenId;
    }

    function _getMaleTokenToBeMinted(uint16 tokenMinted_) internal returns (uint16 tokenId) {
        uint16 maxIndex = MALE_TOKEN - tokenMinted_;
        uint16 randomNumber = uint16(uint256(keccak256(abi.encodePacked(msg.sender, tokenMinted_, block.number)))) % maxIndex;
        
        //gas saving
        uint16 ind = _tokenMaleMatrix[randomNumber];
        tokenId = ind == 0 ? randomNumber : ind;

        _tokenMaleMatrix[randomNumber] = _tokenMaleMatrix[maxIndex - 1] == 0 ? maxIndex - 1 : _tokenMaleMatrix[maxIndex - 1];
    }

    function _getFemaleTokenToBeMinted(uint16 tokenMinted_) internal returns (uint16 tokenId) {
        uint16 maxIndex = FEMALE_TOKEN - tokenMinted_;
        uint16 randomNumber = uint16(uint256(keccak256(abi.encodePacked(msg.sender, tokenMinted_, block.number)))) % maxIndex;
        
        //gas saving
        uint16 ind = _tokenFemaleMatrix[randomNumber];
        tokenId = ind == 0 ? randomNumber : ind;

        _tokenFemaleMatrix[randomNumber] = _tokenFemaleMatrix[maxIndex - 1] == 0 ? maxIndex - 1 : _tokenFemaleMatrix[maxIndex - 1];
    }
}