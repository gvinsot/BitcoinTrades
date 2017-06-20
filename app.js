
'use strict';

// @ts-ignore
var  rp  =  require('request-promise-any');
var fs = require('mz/fs');
// @ts-ignore
var moment = require('moment');

var stat =
    {
        "dayVolume":0,
        "lastRate":0,
        "numberOfTrades":0
    };
var currentTime ="";
var currentStat=
    {
        "volume":0,
        "rate":0,
        "numberOfTrades":0
    };

var logException = function(ex) {
    console.log("ERROR:"+ex.message);
}

var loadPreviousStat = function() {
    return fs.readFile('stats.txt', 'utf8')
    .then(function (statString) {
        stat = JSON.parse(statString);
        console.log('Stats loaded');
    });
}


var startGetServerTime= function() {
    var options = {
    'uri': 'https://api.kraken.com/0/public/Time',
    'headers' : { 'API-Key': 'client-api', 'API-Sign':''}
    };

    return rp(options).promise();
}
var endGetServerTime = function(serverTimeString) {
    currentTime= JSON.parse(serverTimeString).result.rfc1123;
    console.log('Time: ' + currentTime);
    // var date = moment.utc(currentTime);       
    // currentTime=date.year()+ "-"+month+"-"+date.date()+"T"+date.hours()+":"+date.minutes()+":"+date.seconds();
}

var startGetLastTicker = function() {
   var options = {
    'uri': 'https://api.kraken.com/0/public/Ticker?pair=XXBTZEUR',
    'headers' : { 'API-Key': 'client-api', 'API-Sign':''}
    };

    return rp(options).promise();
}

var endGetLastTicker = function(resultString) {
        var resultObject = JSON.parse(resultString);
        var currentRate=parseFloat(resultObject.result.XXBTZEUR.c[0]);

        var dayTrades=resultObject.result.XXBTZEUR.t[0];
        currentStat.numberOfTrades = dayTrades-stat.numberOfTrades;
        if(currentStat.numberOfTrades<0)
            currentStat.numberOfTrades = dayTrades;
        
        var dayVolume=resultObject.result.XXBTZEUR.v[0];
        currentStat.volume = dayVolume-stat.dayVolume;
        if(currentStat.volume<0)
            currentStat.volume = dayVolume;
        
        currentStat.rate = ( currentRate + stat.lastRate)/2;  

        stat.dayVolume=dayVolume;
        stat.numberOfTrades=dayTrades;
        stat.lastRate=currentRate;
        
        console.log("Rate: "+currentRate+"€");
    };

var saveTransactionLogs = function() {
    return fs.appendFile('transactionLogs.txt', currentTime+";"+currentStat.rate+";"+currentStat.volume+";"+currentStat.numberOfTrades+ "\r\n");                    
}

var saveStats = function () {
        var toWrite=JSON.stringify(stat);
        fs.writeFileSync('stats.txt',toWrite, 'utf8' );
        console.log('Saved stats');
    };

var p1 = Promise.resolve(loadPreviousStat).catch(logException);    
var p2 = Promise.resolve(startGetServerTime)
    .then(endGetServerTime).catch(logException);
var p3 = Promise.resolve(startGetLastTicker)
    .then(endGetLastTicker).catch(logException);

Promise.all([p1,p2,p3])
    .then(saveTransactionLogs).catch(logException)
    .then(saveStats).catch(logException)
    .then(function(){console.log("Finished");process.exit(0);},
         function(){console.log("Failed");;process.exit(0);});//
