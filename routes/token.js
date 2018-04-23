#!/usr/bin/env node

/*
    Endpoint for client interface with ERC-20 tokens
*/

var huc = require('./weburelay').huc;

var BigNumber = require('bignumber.js');
var hucUnits  = require(__lib + "hucUnits.js")

const ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}];

const Contract = huc.contract(ABI);


module.exports = function(req, res){
  console.log(req.body)

  var contractAddress = req.body.address;

  var Token = Contract.at(contractAddress);

  if (!("action" in req.body))
    res.status(400).send();
  else if (req.body.action=="info") {
    try {
      var actualBalance = huc.getBalance(contractAddress);
          actualBalance = hucUnits.toHuc(actualBalance, 'wei');
      var totalSupply = Token.totalSupply();
      // totalSupply = hucUnits.toHuc(totalSupply, 'wei')*100;
      
      var decimals = Token.decimals();
      var name     = Token.name();
      var symbol   = Token.symbol();

      var count = huc.getTransactionCount(contractAddress);
      var tokenData = {
        "balance": actualBalance,
        "total_supply": totalSupply,
        "count": count,
        "name": name,
        "symbol": symbol,
        "bytecode": huc.getCode(contractAddress)
      }
      res.write(JSON.stringify(tokenData));
      res.end();
    } catch (e) {
      console.error(e);
    }
  } else if (req.body.action=="balanceOf") {
    var addr = req.body.user.toLowerCase();
    try {
      var tokens = Token.balanceOf(addr);
      // tokens = hucUnits.toHuc(tokens, 'wei')*100;
      res.write(JSON.stringify({"tokens": tokens}));
      res.end();
    } catch (e) {
      console.error(e);
    }
  } 
  
};  

const MAX_ENTRIES = 50;