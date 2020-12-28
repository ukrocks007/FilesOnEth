pragma solidity >=0.7.0 <0.8.0;
contract DigiLocker {
   
    struct Citizen {
        string name;
        string email;
        string file;
    }

    address public admin;

    mapping(string => Citizen) public citizens;
    
    constructor() {
        admin = msg.sender;
    }

    function addCitizen(string memory Name, string memory Email, string memory File) public {
        Citizen memory newCitizen = Citizen({name:Name, email:Email, file: File});
        citizens[Email] = newCitizen;
    }
}
