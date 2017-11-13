// 'use strict';

var request = require('request');
var crypto = require('crypto');
var Promise = require('promise');

const ORDER_SYMBOL = "XBTUSD";
const BitMEXClient = require('./index');

var url = 'https://www.bitmex.com/api/v1';
var testnet = false;
var apiKey = "YOUR API KEY";
var apiSecret = "YOUR API SECRET";

// var url = 'https://testnet.bitmex.com/api/v1';
// var testnet = true;
// var apiKey = "YOUR API TEST KEY";
// var apiSecret = "YOUR API TEST SECRET";


var instrument;
var marginBalance;
var currentQty;

var callApi = function(path, data,verb='POST') {
	return new Promise(function(resolve,reject){
		var expires = new Date().getTime() + (60 * 1000);
		var postBody = JSON.stringify(data);
		var signature = crypto.createHmac('sha256', apiSecret).update(verb + '/api/v1'+path + expires + postBody).digest('hex');

		var headers = {
		  'content-type' : 'application/json',
		  'Accept': 'application/json',
		  'X-Requested-With': 'XMLHttpRequest',
		  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
		  // https://www.bitmex.com/app/apiKeysUsage for more details.
		  'api-expires': expires,
		  'api-key': apiKey,
		  'api-signature': signature
		};

		request({
		    headers: headers,
		    url:url+path,
		    method: verb,
		    body: postBody
		  },
		  function(error, response, body) {
		    if (error) { reject(error);}
		    else {resolve(response);}
		  }
		);
	});
}


//change leverage to 10
var positionData = {symbol:ORDER_SYMBOL, leverage:5};
callApi('/position/leverage',positionData).then(function(res){
	console.log("leverage changed");
	// console.log(res);
}, function(err){
	console.error(err);
});

var express = require('express');

var app = express();
app.get('/order', function index(req, res){
	if(req.query.action == 'buy') {
		var percentage = 0.014;
		var stopPercentage = 0.008;
		var orderQuantity = 2000;
		var instant = 0;
		if(req.query.percentage) percentage = Number(req.query.percentage).toFixed(3);
		if(req.query.orderQuantity) orderQuantity = parseInt(req.query.orderQuantity);
		if(req.query.instant) instant = parseInt(req.query.instant);
		if(req.query.stopPercentage) stopPercentage = Number(req.query.stopPercentage).toFixed(3);

		// console.log({symbol:ORDER_SYMBOL,clOrdLinkID:uuid,contingencyType:'OneCancelsTheOther',ordType:'LimitIfTouched',orderQty:-orderQuantity,price:parseFloat(Number(instrument.lastPrice*(1+parseFloat(percentage))+0.1).toFixed(1)),stopPx:parseFloat(Number(instrument.lastPrice*(1+parseFloat(percentage))).toFixed(1)),execInst:'LastPrice,Close'});
		//console.log({symbol:ORDER_SYMBOL,ordType:'Stop',stopPx:parseFloat(Number(instrument.lastPrice*0.986).toFixed(1)),execInst:'LastPrice,Close'});
		var uuid=createUUID();
		var buyPrice = parseFloat(Number(instrument.bidPrice).toFixed(1));
		if(instant == 1) buyPrice += 10;
		callApi('/order/bulk',{orders:[
			//caculate how many to buy, TODO price:parseFloat(Number(instrument.midPrice).toFixed(1))
			{symbol:ORDER_SYMBOL,ordType:'Limit',orderQty:orderQuantity,price:buyPrice},
			//place take-profit-limit sell order
			{symbol:ORDER_SYMBOL,clOrdLinkID:uuid,contingencyType:'OneCancelsTheOther',ordType:'LimitIfTouched',orderQty:-orderQuantity,price:parseFloat(Number(instrument.lastPrice*(1+parseFloat(percentage))+0.1).toFixed(1)),stopPx:parseFloat(Number(instrument.lastPrice*(1+parseFloat(percentage))).toFixed(1)),execInst:'LastPrice,Close'},
			//place stop-limit sell order
			{symbol:ORDER_SYMBOL,clOrdLinkID:uuid,contingencyType:'OneCancelsTheOther',ordType:'Stop',orderQty:-orderQuantity,stopPx:parseFloat(Number(instrument.lastPrice*(1-stopPercentage)).toFixed(1)),execInst:'LastPrice,Close'}
			]}).then(function(rex){
			// console.log(res);
			res.send({ret:'success'});
		}, function(err){
			res.status(400).send({ret:'error',err:JSON.stringify(err)});
			console.error(err);
		});	
		// console.log({symbol:ORDER_SYMBOL,ordType:'Limit',orderQty:orderQuantity,price:instrument.midPrice});

	} else if(req.query.action == 'sell') {
		var percentage = 0.014;
		var stopPercentage = 0.008;
		var orderQuantity = 2000;
		var instant = 0;
		if(req.query.percentage) percentage = Number(req.query.percentage).toFixed(3);
		if(req.query.instant) instant = parseInt(req.query.instant);
		if(req.query.orderQuantity) orderQuantity = parseInt(req.query.orderQuantity);
		if(req.query.stopPercentage) stopPercentage = Number(req.query.stopPercentage).toFixed(3);
		var uuid=createUUID();
		var sellPrice = parseFloat(Number(instrument.askPrice).toFixed(1));
		if(instant == 1) sellPrice -= 10;
		callApi('/order/bulk',{orders:[
			//caculate how many to buy, TODO price:parseFloat(Number(instrument.midPrice).toFixed(1))
			{symbol:ORDER_SYMBOL,ordType:'Limit',orderQty:-orderQuantity,price:sellPrice},
			//place take-profit-limit sell order
			{symbol:ORDER_SYMBOL,clOrdLinkID:uuid,contingencyType:'OneCancelsTheOther',ordType:'LimitIfTouched',orderQty:orderQuantity,price:parseFloat(Number(instrument.lastPrice*(1-parseFloat(percentage))-0.1).toFixed(1)),stopPx:parseFloat(Number(instrument.lastPrice*(1-parseFloat(percentage))).toFixed(1)),execInst:'LastPrice,Close'},
			//place stop-limit sell order
			{symbol:ORDER_SYMBOL,clOrdLinkID:uuid,contingencyType:'OneCancelsTheOther',ordType:'Stop',orderQty:orderQuantity,stopPx:parseFloat(Number(instrument.lastPrice*(1+parseFloat(stopPercentage))).toFixed(1)),execInst:'LastPrice,Close'}
			]}).then(function(rex){
			// console.log(res);
			res.send({ret:'success'});
		}, function(err){
			res.status(400).send({ret:'error',err:JSON.stringify(err)});
			console.error(err);
		});	
	} else if(req.query.action == 'close') {
		callApi('/order/all',{symbol:ORDER_SYMBOL},'DELETE').then(function(rex){
			// console.log(res);
			callApi('/order',{symbol:ORDER_SYMBOL,execInst:'Close'}).then(function(rex){
				// console.log(res);
				res.send({ret:'success'});
			}, function(err){
				res.status(400).send({ret:'error',err:JSON.stringify(err)});
				console.error(err);
			});	
		}, function(err){
			res.status(400).send({ret:'error',err:JSON.stringify(err)});
			console.error(err);
		});
	} else if(req.query.action == 'wallet') {
		res.send({ret:'success',wallet:''+marginBalance,position:''+currentQty});
	}
    
});
var server = app.listen(3001, function() {
	console.log('Listening on port %d', server.address().port);
});



// See 'options' reference below
const client = new BitMEXClient({testnet: testnet,apiKeyID:apiKey,apiKeySecret:apiSecret});
// handle errors here. If no 'error' callback is attached. errors will crash the client.
client.on('error', console.error);
client.on('open', () => console.log('Connection opened.'));
client.on('close', () => console.log('Connection closed.'));
client.on('initialize', () => console.log('Client initialized, data is flowing.'));


var order_posted = false;

client.addStream('XBTUSD', 'instrument', function(data, symbol, tableName) {
	instrument = data[0];
	console.log(instrument.lastPrice);
	// console.log(instrument);
  
});

client.addStream('XBTUSD', 'margin', function(data, symbol, tableName) {
  // console.log(data,symbol,tableName);
  marginBalance = parseFloat(data[0].marginBalance)/100000000;
  console.log(marginBalance);
  // Do something with the table data...
});

client.addStream('XBTUSD', 'position', function(data, symbol, tableName) {
  // console.log(data,symbol,tableName);
  // marginBalance = parseFloat(data[0].marginBalance)/100000000;
  // console.log(data);
  currentQty = data[0].currentQty;
  // Do something with the table data...
});


function createUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

//post an order

