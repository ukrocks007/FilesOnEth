const express = require('express');
const bodyParser = require('body-parser');
const ABI = require("./contracts/abi.json");
const Web3 = require('web3');
const app = express();
const multer = require('multer');
var fs = require('fs');
const { createGzip } = require('zlib');
const gzip = createGzip();

var upload = multer({ storage: multer.memoryStorage() });

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json({
    extended: true
}))

// const { ethers } = require('ethers')

// const itx = new ethers.providers.JsonRpcProvider(etherUrl)

// const signer = new ethers.Wallet('cf310a9c0d140a3a16d5463da072c6f2d743bc2ce7ccbad49135e1f75397321e', itx)

let web3 = new Web3();

let etherUrl = 'HTTP://127.0.0.1:7545';

web3.setProvider(new web3.providers.HttpProvider(etherUrl));

let contract = new web3.eth.Contract(ABI, "0x6d563b5F9afC309880C5616D1d6BB546a92DF6ff", {
    from: '0x306dD96b592f00f468548aa225b6E87f75Fe910d', // default from address
    gasPrice: '20000000000' // default gas price in wei, 20 gwei in this case
});

app.post("/", async (req, res) => {
    try {
        let result = await contract.methods.addCitizen("Utkarsh", "ukrocks.mehta@gmail.com", "qkjhdqjdqjndjqnw").send();
        console.log(result);
        res.status(200).json(result);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

app.get("/", async (req, res) => {
    try {
        let citizen = await contract.methods.citizens(req.query.email).call();
        res.status(200).json(citizen);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

app.post("/file/:email", upload.single('pdf'), async (req, res) => {
    try {
        let citizen = await contract.methods.citizens(req.params.email).call();
        let file = Buffer.from(req.file.buffer).toString('base64');
        console.log("File Size: ", file.length);
        let estimate = await contract.methods.addCitizen(citizen.name, req.params.email, file).estimateGas();
        console.log("Estimate", estimate);
        let result = await contract.methods.addCitizen(citizen.name, req.params.email, file).send({
            gas: estimate
        });
        console.log(result);
        res.status(200).json(result);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

app.listen(1234, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`Started listening on port 1234`);
    }
});