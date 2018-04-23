/*
  Tool for calculating block stats
*/
var Webu        = require('webu');
var mongoose    = require( 'mongoose' );
var BlockStat   = require( '../db-stats.js' ).BlockStat;

var updateStats = function() {

    // console.log('Webu.providers.HttpProvider:',Webu.providers);
    var webu = new Webu(new Webu.providers.HttpProvider('http://localhost:8545'));

    mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/blockDB');
    mongoose.set('debug', true);

    var latestBlock = webu.huc.blockNumber;
    getStats(webu, latestBlock, null, latestBlock - 1000);
}


var getStats = function(webu, blockNumber, nextBlock, endBlock) {
    if (blockNumber <= endBlock)
        process.exit(9);

    if(webu.isConnected()) {

        webu.huc.getBlock(blockNumber, true, function(error, blockData) {
            if(error) {
                console.log('Warning: error on getting block with hash/number: ' +
                    blockNumber + ': ' + error);
            }
            else if(blockData == null) {
                console.log('Warning: null block data received from the block with hash/number: ' +
                    blockNumber);
            }
            else {
                if (nextBlock)
                    checkBlockDBExistsThenWrite(webu, blockData, nextBlock.timestamp);
                else
                    checkBlockDBExistsThenWrite(webu, blockData, parseInt(Date.now()/1000));
            }
        });
    } else {
        console.log('Error: Aborted due to webu is not connected when trying to ' +
            'get block ' + blockNumber);
        process.exit(9);
    }
}

/**
  * Checks if the a record exists for the block number 
  *     if record exists: abort
  *     if record DNE: write a file for the block
  */
var checkBlockDBExistsThenWrite = function(webu, blockData, nextTime) {
    BlockStat.find({number: blockData.number}, function (err, b) {
        if (!b.length) {
            // calc hashrate, txCount, blocktime, uncleCount
            var stat = {
                "number": blockData.number,
                "timestamp": blockData.timestamp,
                "difficulty": blockData.difficulty,
                "txCount": blockData.transactions.length,
                "gasUsed": blockData.gasUsed,
                "gasLimit": blockData.gasLimit,
                "miner": blockData.miner,
                "blockTime": nextTime - blockData.timestamp,
                "uncleCount": blockData.uncles.length
            }
            new BlockStat(stat).save( function( err, s, count ){
                console.log(s)
                if ( typeof err !== 'undefined' && err ) {
                   console.log('Error: Aborted due to error on ' + 
                        'block number ' + blockData.number.toString() + ': ' + 
                        err);
                   process.exit(9);
                } else {
                    console.log('DB successfully written for block number ' +
                        blockData.number.toString() );    
                    getStats(webu, blockData.number - 1, blockData);     
                }
            });
        } else {
            console.log('Aborting because block number: ' + blockData.number.toString() + 
                ' already exists in DB.');
            return;
        }

    })
}

/** On Startup **/
// ghuc --rpc --rpcaddr "localhost" --rpcport "8545"  --rpcapi "huc,net,webu"

var minutes = 1;
statInterval = minutes * 60 * 1000;

setInterval(function() {
  updateStats();
}, statInterval);
