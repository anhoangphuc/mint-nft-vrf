// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import "./interfaces/ISummoner.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract FirstSaleMinterVrf is VRFConsumerBaseV2, Ownable {
    ISummonerUpgradeable public immutable summoner;
    VRFCoordinatorV2Interface public immutable COORDINATOR;
    bytes32 public immutable keyHash;
    uint64 public immutable subcriptionId;
    address public treasury;
    IERC20 public immutable WETH;

    mapping(uint256 => address) requestIdToAddress;
    mapping(uint256 => bool) isRequestIdWhitelist; 

    mapping(uint16 => uint16) private _tokenMaleMatrix;
    mapping(uint16 => uint16) private _tokenFemaleMatrix;

    mapping(address => bool) isWhitelisted;

    uint16 constant public FEMALE_INDEX_START = 3500;
    uint16 constant public WHITELIST_MINT = 500;
    uint16 constant public PUBLIC_MINT = 3000;
    uint16 constant public MALE_TOKEN = 3500;
    uint16 constant public FEMALE_TOKEN = 500;
    uint256 constant public WHITELIST_FEE = 0.3 ether;
    uint256 constant public PUBLIC_FEE = 0.05 ether;

    uint16 public publicMinted = 0;
    uint16 public whitelistMinted = 0;
    uint16 public maleMinted = 0;
    uint16 public femaleMinted = 0;

    bool public whitelistPhaseOpen;
    bool public publicPhaseOpen;

    event PublicMint(address indexed to, uint256 indexed maleId);
    event WhitelistMint(address indexed to, uint256 indexed maleId, uint256 indexed femaleId);
    event RequestPublicMint(address indexed user, uint256 indexed requestId, uint256 indexed publicMinted);
    event RequestWhitelistMint(address indexed user, uint256 indexed requestId, uint256 indexed whitelistMinted);
    event TreasuryChanged(address from, address to);
    event WhitelistPhaseToggled(bool currentStatus);
    event PublicPhaseToggled(bool currentStatus);
    event WhitelistAdded(address[] users);
    event WhitelistRemoved(address[] users);

    error UserWhitelisted(address user);
    error UserNotWhitelisted(address user);

    constructor(address vrfCoordinator_, bytes32 keyHash_, uint64 subcriptionId_, address summoner_, address weth_, address treasury_) VRFConsumerBaseV2(vrfCoordinator_) Ownable(){
        require(vrfCoordinator_ != address(0), 'cons::zero vrf');
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator_);
        keyHash = keyHash_;
        subcriptionId = subcriptionId_;

        require(summoner_ != address(0), "cons::zero summoner");
        summoner = ISummonerUpgradeable(summoner_);
        require(weth_ != address(0), "cons::zero weth");
        WETH = IERC20(weth_);
        require(treasury_ != address(0), "cons::zero treasury");
        treasury = treasury_;
    }

    function mintWhitelist() external {
        require(whitelistPhaseOpen, "whitelist::not open");
        require(whitelistMinted < WHITELIST_MINT, 'whitelist::exceed');
        require(isWhitelisted[msg.sender], "whitelist::not whitelisted");
        uint256 requestId = COORDINATOR.requestRandomWords(keyHash, subcriptionId, 3, 2500000, 1);
        requestIdToAddress[requestId] = msg.sender;
        isRequestIdWhitelist[requestId] = true;
        whitelistMinted++;
        WETH.transferFrom(msg.sender, treasury, WHITELIST_FEE);
        emit RequestWhitelistMint(msg.sender, requestId, whitelistMinted);
    }

    function mintPublic() external {
        require(publicPhaseOpen, "public::not open");
        require(publicMinted < PUBLIC_MINT, 'public::exceed');
        uint256 requestId = COORDINATOR.requestRandomWords(keyHash, subcriptionId, 3, 2500000, 1);
        requestIdToAddress[requestId] = msg.sender;
        publicMinted++;
        WETH.transferFrom(msg.sender, treasury, PUBLIC_FEE);
        emit RequestPublicMint(msg.sender, requestId, publicMinted);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address to = requestIdToAddress[requestId];
        uint256 randomValue = randomWords[0];
        if (isRequestIdWhitelist[requestId]) {
            _mintWhitelist(to, randomValue);
        } else {
            _mintPublic(to, randomValue);
        }
    }

    function _mintWhitelist(address to, uint256 randomValue) internal {
        uint16 maleId = _mintMale(to, maleMinted, randomValue);
        maleMinted++;

        uint16  femaleId = _mintFemale(to, femaleMinted, randomValue);
        femaleMinted++;

        emit WhitelistMint(to, maleId, femaleId);
    }
    
    function _mintPublic(address to, uint256 randomValue) internal {
        uint16 maleId = _mintMale(to, maleMinted, randomValue);
        maleMinted++;

        emit PublicMint(to, maleId);
    }


    function _mintMale(address to, uint16 tokenMinted_, uint256 randomValue) internal returns (uint16) {
        uint16 tokenId = _getMaleTokenToBeMinted(tokenMinted_, randomValue);
        summoner.mint(to, tokenId);
        return tokenId;
    }

    function _mintFemale(address to, uint16 tokenMinted_, uint256 randomValue) internal returns (uint16) {
        uint16 tokenId = _getFemaleTokenToBeMinted(tokenMinted_, randomValue);
        summoner.mint(to, tokenId);
        return tokenId;
    }

    function _getMaleTokenToBeMinted(uint16 tokenMinted_, uint256 randomValue) internal returns (uint16 tokenId) {
        uint16 maxIndex = MALE_TOKEN - tokenMinted_;
        uint16 randomNumber = uint16(randomValue % maxIndex);
        
        //gas saving
        uint16 ind = _tokenMaleMatrix[randomNumber];
        tokenId = ind == 0 ? randomNumber : ind;

        _tokenMaleMatrix[randomNumber] = _tokenMaleMatrix[maxIndex - 1] == 0 ? maxIndex - 1 : _tokenMaleMatrix[maxIndex - 1];
    }

    function _getFemaleTokenToBeMinted(uint16 tokenMinted_, uint256 randomValue) internal returns (uint16 tokenId) {
        uint16 maxIndex = FEMALE_TOKEN - tokenMinted_;
        uint16 randomNumber = uint16(randomValue % maxIndex);
        
        //gas saving
        uint16 ind = _tokenFemaleMatrix[randomNumber];
        tokenId = ind == 0 ? randomNumber : ind;

        _tokenFemaleMatrix[randomNumber] = _tokenFemaleMatrix[maxIndex - 1] == 0 ? maxIndex - 1 : _tokenFemaleMatrix[maxIndex - 1];
        tokenId += FEMALE_INDEX_START;
    }

    function setTreasury(address newTreasury_) external onlyOwner {
        require(newTreasury_ != address(0), 'setTreasury::zero address');
        emit TreasuryChanged(treasury, newTreasury_);
        treasury = newTreasury_;
    }

    function toggleWhitelistPhase() external onlyOwner {
        whitelistPhaseOpen = !whitelistPhaseOpen;
        emit WhitelistPhaseToggled(whitelistPhaseOpen);
    }

    function togglePublicPhase() external onlyOwner {
        publicPhaseOpen = !publicPhaseOpen;    
        emit PublicPhaseToggled(publicPhaseOpen);
    }

    function addWhitelist(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            if (isWhitelisted[users[i]] == true) revert UserWhitelisted({ user: users[i]});
            isWhitelisted[users[i]] = true;
        }
        emit WhitelistAdded(users);
    }

    function removeWhitelist(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            if (isWhitelisted[users[i]] == false) revert UserNotWhitelisted({ user: users[i]});
            isWhitelisted[users[i]] = false;
        }
        emit WhitelistRemoved(users);
    }
}
