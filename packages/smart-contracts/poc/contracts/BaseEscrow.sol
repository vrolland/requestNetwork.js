// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

contract BaseEscrow {
    struct mappedValue {
        bytes value;
        bool flag;
    }

    event EscrowUnlocked(bytes indexed paymentReference, uint256 amount, address payee);
    event EscrowLocked(bytes indexed paymentReference, uint256 amount, address payee);

    mapping(address => mappedValue) paymentRefOfEscrow;

    function registerEscrowForRef(bytes calldata _paymentReference) public {
        require(!paymentRefOfEscrow[msg.sender].flag, "Escrow already registered for this payment refrerence.");
        paymentRefOfEscrow[msg.sender].value = _paymentReference;
        paymentRefOfEscrow[msg.sender].flag = true;
    }

    // Only the good escrow contract can call this for a specific payment reference
    function informEscrowReceived(bytes calldata _paymentReference, uint256 _amount, address _payee) public {
        require(keccak256(abi.encodePacked( paymentRefOfEscrow[msg.sender].value)) == keccak256(abi.encodePacked(_paymentReference)), "Unauthorized for this payment reference.");
        emit EscrowLocked(_paymentReference, _amount, _payee);
    }

    // Only the good escrow contract can call this for a specific payment reference
    function informWithdrawal(bytes calldata _paymentReference, uint256 _amount, address _payee) public {
        require(keccak256(abi.encodePacked( paymentRefOfEscrow[msg.sender].value)) == keccak256(abi.encodePacked(_paymentReference)), "Unauthorized for this payment reference.");
        emit EscrowUnlocked(_paymentReference, _amount, _payee);
    }
}