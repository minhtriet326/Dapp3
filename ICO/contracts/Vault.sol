//SPDX-License-Identifier: UNLICENSED
pragma solidity <= 0.8.17;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract Vault is Ownable, AccessControlEnumerable {
    IERC20 private token;//biến này nhận nạp vào và rút ra loại token nào
    uint256 public maxWithdrawAmount;
    bool public withdrawEnable;
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    function setWithdrawEnable(bool _isEnable) public onlyOwner {
        withdrawEnable = _isEnable;
    }

    function setMaxWithdrawAmount(uint256 _amount) public onlyOwner {
        maxWithdrawAmount = _amount;
    }

    function setToken(IERC20 _token) public onlyOwner {
        token = _token;
    }

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());//set cho owner(ví deploy) quyền admin
    }

    function withdraw(
        uint256 _amount,
        address _to
    ) external onlyWithdrawer {
        require(withdrawEnable, "Withdraw is not available");
        require(_amount <= maxWithdrawAmount, "Exceed maximun amount");
        token.transfer(_to, _amount);
    }

    function deposit(uint256 _amount) external {
        require(
            token.balanceOf(msg.sender) >= _amount,
            "Insufficient account balance"
        );
        SafeERC20.safeTransferFrom(token, msg.sender, address(this), _amount);
    }

    modifier onlyWithdrawer() {
        require(_msgSender() == owner() || hasRole(WITHDRAWER_ROLE, _msgSender()), "Caller is not a withdrawer");
        _;
    }
}