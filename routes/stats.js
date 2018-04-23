var mongoose = require( 'mongoose' );
var Block     = mongoose.model( 'Block' );
var BlockStat = mongoose.model( 'BlockStat' );
var filters = require('./filters');

var https = require('https');
var async = require('async');

var hucUnits = require(__lib + "hucUnits.js")

module.exports = function(req, res) {

  if (!("action" in req.body))
    res.status(400).send();
  
  else if (req.body.action=="miners") 
    getMinerStats(res)
  
  else if (req.body.action=="hashrate") 
    getHashrate(res);
  
}
/**
  Aggregate miner stats
**/
var getMinerStats = function(res) {
  BlockStat.aggregate([
      { $group: {
        _id: '$miner',  
        count: {$sum: 1} }
      }
  ], function (err, result) {
      if (err) {
        console.error(err);
        res.status(500).send();
      } else {
        res.write(JSON.stringify(result));
        res.end();
      }
  });
}
/**
  Get hashrate Diff stuff
**/
var getHashrate = function(res) {
  var blockFind = Block.find({}, "difficulty timestamp number")
                      .lean(true).sort('-number').limit(100);
  blockFind.exec(function (err, docs) {
  var blockTime = (docs[0].timestamp - docs[99].timestamp)/100;
  var hashrate = docs[0].difficulty / blockTime;
    res.write(JSON.stringify({
        "blocks": docs,
        "hashrate": hashrate,
        "blockTime": blockTime,
        "blockHeight": docs[0].number,
        "difficulty": docs[0].difficulty
    }));
    res.end();
  });
}
/**
  OLD CODE DON'T USE
  Swipe HUC HUC data
**/
var getEtcHuc = function(res) {
  var options = [{
    host: 'api.minergate.com',
    path: '/1.0/huc/status',
    method: 'GET',
    data: 'huc'
  },{
    host: 'api.minergate.com',
    path: '/1.0/huc/status',
    method: 'GET',
    data: 'huc'
  }];
  
  async.map(options, function(opt, callback) {
    
    https.request(opt, function(mg) {
      mg.on('data', function (data) {
        try {
          var result = JSON.parse(data.toString());
          result.chain = opt.data;
          callback(null, result);
        } catch (e) {
          callback(e);
        }
      })
    }).end();
  }, function(err, results) {
    if (err) {
      console.error(err);
      res.status(500).send();
    } else {
      if (results.length < 2)
        res.status(500).send();
      else {
        var c = ((results[0].chain == "huc") ? 0 : 1);
        var h = 1 - c;
        var hucHashrate = parseInt(results[c].instantHashrate);
        var hucHashrate = parseInt(results[h].instantHashrate);
        var hucDiff = results[c].difficulty.toFixed(2);
        var hucDiff = results[h].difficulty.toFixed(2);
        var hucHucHash = parseInt(100*hucHashrate/hucHashrate);
        var hucHucDiff = parseInt(100*hucDiff/hucDiff);
        res.write(JSON.stringify({
          "hucHashrate": hucHashrate,
          "hucHashrate": hucHashrate,
          "hucDiff": hucDiff,
          "hucDiff": hucDiff,
          "hucHucHash": hucHucHash,
          "hucHucDiff": hucHucDiff
        }));
        res.end();
      } 
    }

  });
}
