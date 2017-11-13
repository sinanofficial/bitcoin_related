### Node.JS Adapter for BitMEX Realtime Data by heack

This is nodejs & IOS app to let you make orders for just one click:
1. place order, long/short both supported.
2. auto place stop order.
3. auto place take profit limit order.
4. view current wallet balances.

#### Usage

> The following is runnable in [one_click_trade.js](one_click_trade.js).

To get started, modify one_click_trade.js to add your apikey/apisecret:

```js
var apiKey = "YOUR API TEST KEY";
var apiSecret = "YOUR API TEST SECRET";
```

Then run command:

```bash
forever start one_click_trade.js
```

You may want to test on bitmex testnet first.


#### IOS usage

###### setup

find FirstViewController.m


```C
#define API_HOST @"http://YOUR_SERVER_IP:3001/"
```
then compile and run, enjoy it.

If you like it, feel free to donate to:

BTC:
1H3DUXaDVhrVv6Kh3uwQmmy81MUTYKfKFC

