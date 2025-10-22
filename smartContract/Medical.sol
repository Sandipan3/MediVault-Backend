// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AccessControl {
  
    mapping(address => mapping(address => uint256)) public accessExpiry;

    uint256 public constant ACCESS_DURATION = 900; // 15 * 60

    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        uint256 expiry
    );

    event AccessRevoked(
        address indexed patient,
        address indexed doctor
    );

  
    function grantAccess(address _doctor) external {
        require(_doctor != address(0), "Invalid doctor address");

        // Set the expiration time to 15 minutes from now
        uint256 expiry = block.timestamp + ACCESS_DURATION;

        // The patient (msg.sender) grants access to the doctor
        accessExpiry[msg.sender][_doctor] = expiry;

        emit AccessGranted(msg.sender, _doctor, expiry);
    }

    
    function revokeAccess(address _doctor) external {
        require(_doctor != address(0), "Invalid doctor address");
        
        accessExpiry[msg.sender][_doctor] = 0; // Set expiry to 0
        
        emit AccessRevoked(msg.sender, _doctor);
    }

    
    function checkAccess(address _patient, address _doctor) external view returns (bool) {
        uint256 expiry = accessExpiry[_patient][_doctor];
        
        return expiry > block.timestamp;
    }
}