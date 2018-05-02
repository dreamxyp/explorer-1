#!/usr/bin/env node

/*
    Endpoint for client to talk to huc node
*/

var Webu = require("webu");
var webu;

var BigNumber = require('bignumber.js');
var hucUnits = require(__lib + "hucUnits.js")

var getLatestBlocks = require('./index').getLatestBlocks;
var filterBlocks = require('./filters').filterBlocks;
var filterTrace = require('./filters').filterTrace;


if (typeof webu !== "undefined") {
  webu = new Webu(webu.currentProvider);
} else {
  webu = new Webu(new Webu.providers.HttpProvider("http://112.74.96.198:8545"));
}

if (webu.isConnected()) 
  console.log("webu connection established");
else
  throw "No connection";


var newBlocks = webu.huc.filter("latest");
var newTxs = webu.huc.filter("pending");

exports.data = function(req, res){
  console.log(req.body)

  if ("tx" in req.body) {
    var txHash = req.body.tx.toLowerCase();

    webu.huc.getTransaction(txHash, function(err, tx) {
      if(err || !tx) {
        console.error("Txwebu error :" + err)
        if (!tx) {
          webu.huc.getBlock(txHash, function(err, block) {
            if(err || !block) {
              console.error("Blockwebu error :" + err)
              res.write(JSON.stringify({"error": true}));
            } else {
              console.log("Blockwebu found: " + txHash)
              res.write(JSON.stringify({"error": true, "isBlock": true}));
            }
            res.end();
          });
        } else {
          res.write(JSON.stringify({"error": true}));
          res.end();
        }
      } else {
        var ttx = tx;
        ttx.value = hucUnits.toHuc( new BigNumber(tx.value), "wei");
        //get timestamp from block
        var block = webu.huc.getBlock(tx.blockNumber, function(err, block) {
          if (!err && block)
            ttx.timestamp = block.timestamp;
          ttx.isTrace = (ttx.input != "0x");
          res.write(JSON.stringify(ttx));
          res.end();
        });
      }
    });

  } else if ("tx_trace" in req.body) {
    var txHash = req.body.tx_trace.toLowerCase();

    webu.trace.transaction(txHash, function(err, tx) {
      if(err || !tx) {
        console.error("Tracewebu error :" + err)
        res.write(JSON.stringify({"error": true}));
      } else {
        res.write(JSON.stringify(filterTrace(tx)));
      }
      res.end();
    });
  } else if ("addr_trace" in req.body) {
    var addr = req.body.addr_trace.toLowerCase();
    // need to filter both to and from
    // from block to end block, paging "toAddress":[addr], 
    // start from creation block to speed things up 
    // TODO: store creation block
    var filter = {"fromBlock":"0x1d4c00", "toAddress":[addr]};
    webu.trace.filter(filter, function(err, tx) {
      if(err || !tx) {
        console.error("Tracewebu error :" + err)
        res.write(JSON.stringify({"error": true}));
      } else {
        res.write(JSON.stringify(filterTrace(tx)));
      }
      res.end();
    }) 
  } else if ("addr" in req.body) {
    var addr = req.body.addr.toLowerCase();
    var options = req.body.options;

    var addrData = {};

    if (options.indexOf("balance") > -1) {
      try {
        addrData["balance"] = webu.huc.getBalance(addr);  
        addrData["balance"] = hucUnits.toHuc(addrData["balance"], 'wei');
      } catch(err) {
        console.error("Addrwebu error :" + err);
        addrData = {"error": true};
      }
    }
    if (options.indexOf("count") > -1) {
      try {
         addrData["count"] = webu.huc.getTransactionCount(addr);
      } catch (err) {
        console.error("Addrwebu error :" + err);
        addrData = {"error": true};
      }
    }
    if (options.indexOf("bytecode") > -1) {
      try {
         addrData["bytecode"] = webu.huc.getCode(addr);
         if (addrData["bytecode"].length > 2) 
            addrData["isContract"] = true;
         else
            addrData["isContract"] = false;
      } catch (err) {
        console.error("Addrwebu error :" + err);
        addrData = {"error": true};
      }
    }
   
    res.write(JSON.stringify(addrData));
    res.end();


  } else if ("block" in req.body) {
    var blockNumOrHash;
    if (/^(0x)?[0-9a-f]{64}$/i.test(req.body.block.trim())) {
        blockNumOrHash = req.body.block.toLowerCase();
    } else {
        blockNumOrHash = parseInt(req.body.block);
    }

    webu.huc.getBlock(blockNumOrHash, function(err, block) {
      if(err || !block) {
        console.error("Blockwebu error :" + err)
        res.write(JSON.stringify({"error": true}));
      } else {
        res.write(JSON.stringify(filterBlocks(block)));
      }
      res.end();
    });

    /* 
    / TODO: Refactor, "block" / "uncle" determinations should likely come later
    / Can parse out the request once and then determine the path.
    */
  } else if ("uncle" in req.body) {
    var uncle = req.body.uncle.trim();
    var arr = uncle.split('/');
    var blockNumOrHash; // Ugly, does the same as blockNumOrHash above
    var uncleIdx = parseInt(arr[1]) || 0;

    if (/^(?:0x)?[0-9a-f]{64}$/i.test(arr[0])) {
      blockNumOrHash = arr[0].toLowerCase();
      console.log(blockNumOrHash)
    } else {
      blockNumOrHash = parseInt(arr[0]);
    }

    if (typeof blockNumOrHash == 'undefined') {
      console.error("Unclewebu error :" + err);
      res.write(JSON.stringify({"error": true}));
      res.end();
      return;
    }

    webu.huc.getUncle(blockNumOrHash, uncleIdx, function(err, uncle) {
      if(err || !uncle) {
        console.error("Unclewebu error :" + err)
        res.write(JSON.stringify({"error": true}));
      } else {
        res.write(JSON.stringify(filterBlocks(uncle)));
      }
      res.end();
    });

  } else {
    console.error("Invalid Request: " + action)
    res.status(400).send();
  }

};

exports.huc = webu.huc;
  