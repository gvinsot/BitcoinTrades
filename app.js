
'use strict';
var rp = require('request-promise-any');
var fs = require('mz/fs');
var moment = require('moment');

var stat =
    {
        "dayVolume":0,
        "lastRate":0,
        "numberOfTrades":0
    };
var dateString ="";
var currentStat=
    {
        "volume":0,
        "rate":0,
        "numberOfTrades":0
    };

var logException = function(ex)
{
    Console.log("ERROR:"+ex.message);
}

var loadPreviousStat = function()
{
    return fs.readFile('stats.txt', 'utf8')
    .then(function (statString) {
        stat = JSON.parse(statString);
        console.log('Stats loaded');
    });
}


var getServerTime= new function()
{
        var options = {
        'uri': 'https://api.kraken.com/0/public/Time',
        'headers' : { 'API-Key': 'client-api', 'API-Sign':''}
        };

        return rp(options).then(function(serverTimeString) {
                console.log('Retrieved Server Time');
                var date = moment.unix(JSON.parse(serverTimeString).result.unixtime);            
                dateString=date.year()+ ";"+(date.month()+1)+";"+date.date()+";"+date.hours()+";"+date.minutes();
                resolve();
            }).inspect();
}

var getLastTicker = new function()
{
   var options = {
    'uri': 'https://api.kraken.com/0/public/Ticker?pair=XXBTZEUR',
    'headers' : { 'API-Key': 'client-api', 'API-Sign':''}
    };

    return rp(options).then(function(resultString) {
        console.log('Retrieve ticker');
        var resultObject = JSON.parse(resultString);
        var currentRate=resultObject.result.XXBTZEUR.c[0];

        var dayTrades=resultObject.result.XXBTZEUR.t[0];
        currentStat.numberOfTrades = dayTrades-stat.numberOfTrades;
        if(currentStat.numberOfTrades<0)
            currentStat.numberOfTrades = dayTrades;
        
        var dayVolume=resultObject.result.XXBTZEUR.v[0];
        currentStat.volume = dayVolume-stat.dayVolume;
        if(currentStat.volume<0)
            currentStat.volume = dayVolume;
        
        currentStat.rate = ( parseFloat(currentRate) + parseFloat(stat.lastRate))/2;  

        stat.dayVolume=dayVolume;
        stat.numberOfTrades=dayTrades;
        stat.lastRate=currentRate;
        
        console.log("Rate: "+currentRate+"€");
    }).inspect();;
}

var saveStats=function()
{
    return fs.appendFile('transactionLogs.txt', dateString+";"+currentStat.rate+";"+currentStat.volume+";"+currentStat.numberOfTrades+ "\r\n")
    .then(function () {
        var toWrite=JSON.stringify(stat);
        fs.writeFileSync('stats.txt',toWrite, 'utf8' );
        console.log('Saved stats');
    });                
}


Promise.resolve(loadPreviousStat).catch(logException)    
    .then(getServerTime).catch(logException)
    .then(getLastTicker).catch(logException)
    .then(saveStats).catch(logException)
    .then(function(){console.log("Success");},
         function(){console.log("Failed");});//process.exit(0);
