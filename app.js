
'use strict';
var rp = require('request-promise');
var fs = require('mz/fs');
var moment = require('moment');

var stat =
    {
        "dayVolume":0,
        "lastRate":0,
        "numberOfTrades":0
    };

var loadPreviousStat = 
    fs.readFile('stats.txt', 'utf8')
        .then(function (resultString) 
        {
            stat = JSON.parse(resultString);
            console.log('Stats loaded !');
        })
        .catch(function(ex)
        {
        });

var saveStats = new function()
{
   var options = {
    'uri': 'https://api.kraken.com/0/public/Ticker?pair=XXBTZEUR',
    'headers' : { 'API-Key': 'client-api', 'API-Sign':''}
    };


    rp(options)
    .then(function(resultString)
    {
        var resultObject = JSON.parse(resultString);
        var currentRate=resultObject.result.XXBTZEUR.c[0];

        var dayTrades=resultObject.result.XXBTZEUR.t[0];
        var numberOfTrades = dayTrades-stat.numberOfTrades;
        if(numberOfTrades<0)
            numberOfTrades = dayTrades;
        
        var dayVolume=resultObject.result.XXBTZEUR.v[0];
        var volume = dayVolume-stat.dayVolume;
        if(volume<0)
            volume = dayVolume;
        
        var rate = ( parseFloat(currentRate) + parseFloat(stat.lastRate))/2;  

        console.log(resultString+"\n");
        options.uri = 'https://api.kraken.com/0/public/Time';
        rp(options).then(function(resultString)
        {
            var date = moment.unix(JSON.parse(resultString).result.unixtime);
            console.log(resultString+"\n");
            var dateString=date.year()+ ";"+(date.month()+1)+";"+date.date()+";"+date.hours()+";"+date.minutes();
            fs.appendFile('transactionLogs.txt', dateString+";"+rate+";"+volume+";"+numberOfTrades+ "\r\n")
                .then(function () 
                {

                    stat.dayVolume=dayVolume;
                    stat.numberOfTrades=dayTrades;
                    stat.lastRate=currentRate;
                    var toWrite=JSON.stringify(stat);
                    fs.writeFileSync('stats.txt',toWrite, 'utf8' );

                    console.log('Saved!');
                    process.exit(0); // 1 for error
                });
                
        });
    });
}


loadPreviousStat
    .then(saveStats);
