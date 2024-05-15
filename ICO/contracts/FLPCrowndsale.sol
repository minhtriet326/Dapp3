//SPDX-License-Identifier: UNLICENSED
pragma solidity <= 0.8.17;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FLPCrowndsale is Ownable {
    using SafeERC20 for IERC20;
    address payable public _wallet;
    uint256 public BNB_rate;
    uint256 public USDT_rate;
    IERC20 public token;
    IERC20 public usdtToken;//biến lưu trữ địa chỉ hợp đồng của token USDT

    event BuyTokenByBNB(address buyer, uint256 amount);
    event BuyTokenByUSDT(address buyer, uint256 amount);
    event SetUSDTToken(IERC20 tokenAddress);
    event SetBNBRate(uint256 newRate);
    event SetUSDTRate(uint256 newRate);

    constructor (
        uint256 bnb_rate,
        uint256 usdt_rate,
        address payable wallet,//buyer se chuyen tien vao vi nay
        IERC20 icotoken
    ) {
        BNB_rate = bnb_rate;    
        USDT_rate = usdt_rate;
        _wallet = wallet;
        token = icotoken;//ico là đồng mình muốn bán cho khách, trong TH này là đồng FLP nên lúc deploy sẽ truyền vào address của floppy
    }

    function setUSDTToken(IERC20 token_address) public onlyOwner {//muốn bán = đồng nào thì set đồng đó
        usdtToken = token_address;
        emit SetUSDTToken(usdtToken);
    }

    function setBNBRate(uint256 new_rate) public onlyOwner {
        BNB_rate = new_rate;
        emit SetBNBRate(new_rate);
    }

    function setUSDTRate(uint256 new_rate) public onlyOwner {
        USDT_rate = new_rate;
        emit SetUSDTRate(new_rate);
    }

    function buyTokenByBNB() external payable {
        //native token (BNB) là token mà Smart contract có thể nhận và lưu trữ nó. Do đó, Smart contract có thể dễ dàng nhận và chuyển BNB.
        //Người dùng thanh toán trực tiếp bằng BNB thông qua msg.value. msg.value là biến toàn cầu chứa giá trị của giao dịch được gửi tới SC
        uint256 bnbAmount = msg.value;
        uint256 amount = getTokenAmountBNB(bnbAmount);//chuyển đổi đơn vị giữa đồng bnb của khách xem đc bao nhiêu đồng token của mình
        require(amount > 0, "Amount is zero");//check coi khách mua nhiêu
        require(//check coi trong "kho" còn hàng bán ko 
            token.balanceOf(address(this)) >= amount,
            "Insufficient account balance"
        );
        require(//check coi khách đủ tiền mua ko
            msg.sender.balance >= bnbAmount,
            "Insufficient account balance"
        );
        payable(_wallet).transfer(bnbAmount);//chuyển tiền của khách về ví mình
        SafeERC20.safeTransfer(token, msg.sender, amount);//chuyển token cho khách
        emit BuyTokenByBNB(msg.sender, amount);
    }

    function buyTokenByUSDT(uint256 USDTAmount) external payable {//USDTAmount, chỉ định số lượng USDT mà người dùng muốn chi tiêu.
        //Token ERC20 (USDT) được lưu trữ trong ví của người dùng. 
        //Do đó, SC không thể trực tiếp nhận USDT. Thay vào đó, SC phải yêu cầu người dùng chuyển USDT từ ví của họ sang ví được chỉ định của SC.
        uint256 amount = getTokenAmountUSDT(USDTAmount);
        //SC không nhận USDT, thay vào đó nó nhận yêu cầu chuyển USDT từ người dùng thông qua tham số USDTAmount
        require(amount > 0, "Amount is zero");
        require(
            token.balanceOf(address(this)) >= amount,
            "Insufficient account balance"
        );
        require(
            //msg.sender.balance >= USDTAmount,//phải đổi msg.sender.balance thành usdtToken.balanceOf(msg.sender): Dòng này lấy số dư USDT của người dùng hiện tại, so sánh số dư USDT của người dùng với số lượng USDT mà họ muốn mua (USDTAmount)
            usdtToken.balanceOf(msg.sender) >= USDTAmount,//đã đổi
            "Insufficient account balance"
        );
        SafeERC20.safeTransferFrom(usdtToken, msg.sender, _wallet, USDTAmount);//SC dùng hàm này để chuyển USDT từ ví của người dùng sang ví được chỉ định (_wallet) do contract kiểm soát.
        SafeERC20.safeTransfer(token, msg.sender, amount);
        emit BuyTokenByUSDT(msg.sender, amount);
    }

    function getTokenAmountBNB(uint256 BNBAmount) public view returns (uint256) {
        return BNBAmount*BNB_rate;
    }

    function getTokenAmountUSDT(uint256 USDTAmount) public view returns (uint256) {
        return USDTAmount*USDT_rate;
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);//chuyển toàn bộ tiền trong contract(address(this)) về ví đã deploy contract (msg.sender)
        //payable(msg.sender): Chuyển đổi địa chỉ của người gọi hàm (msg.sender) thành kiểu dữ liệu payable để tương thích với phương thức transfer dùng để chuyển ETH
    }

    function withdrawErc20() public onlyOwner {
        usdtToken.transfer(msg.sender, usdtToken.balanceOf(address(this)));
    }
}