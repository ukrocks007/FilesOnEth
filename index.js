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

let contract = new web3.eth.Contract(ABI, "0xb851479f86509A0C08dDFcAf63D88FeAFf7b2D27", {
    from: '0x54D34fa28D612b7339a3B38DB32bD61717d66F21', // default from address
    gasPrice: '20000000000' // default gas price in wei, 20 gwei in this case
});

app.post("/", async (req, res) => {
    try {
        let result = await contract.methods.addCitizen("Utkarsh", "ukrocks.mehta@gmail.com").send();
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
        let data = Buffer.from(req.file.buffer).toString('base64');
        let file = await compress(data);
        let estimate = await contract.methods.addFile(req.params.email, file.length).estimateGas();
        console.log("Estimate", estimate);
        let result = await contract.methods.addFile(req.params.email, file.length).send({
            gas: estimate
        });
        console.log(result);
        uploadDataToEth(file, req.params.email);
        res.status(200).json(result);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

app.get("/file/:email/:index", async (req, res) => {
    let result = await contract.methods.getFileData(req.params.email, req.params.index).call();
    result = await decompress(result);
    console.log(result);
    res.status(200).json({ result: result });
})

const compress = async (data) => {
    return new Promise((resolve, reject) => {
        var LZUTF8 = require('lzutf8');
        LZUTF8.compressAsync(data, { outputEncoding: 'Base64' }, (result, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(result)
            }
        });
    })
}

const decompress = async (data) => {
    return new Promise((resolve, reject) => {
        var LZUTF8 = require('lzutf8');
        LZUTF8.decompressAsync(data, { inputEncoding: 'Base64' }, (result, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(result)
            }
        });
    })
}

const uploadDataToEth = async (file, email) => {
    try {
        // Add File Data
        let remaining = file.length;
        let index = 0, result, results = [], dataToSend, blocksize = 1000, start = 0, xtrgas = 1000000;
        do {
            try {
                dataToSend = file.substr(start, file.length > (start + blocksize) ? (start + blocksize) : file.length)
                estimate = await contract.methods.addFileData(email, "" + index, dataToSend).estimateGas();
                console.log("Estimate", estimate);
                result = await contract.methods.addFileData(email, "" + index, dataToSend).send({
                    gas: estimate,
                    // value: web3.utils.toWei('1', 'ether')
                });
                console.log(result);
                results.push(result);
                index++;
                remaining -= dataToSend.length;
                start += dataToSend.length;
                console.log("Remaining", remaining);
            } catch (ex) {
                console.log(ex);
                console.log("index", index)
            }
        } while (remaining > 0);
    } catch (ex) {
        console.log(ex);
    }
}

app.listen(1234, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`Started listening on port 1234`);
    }
});