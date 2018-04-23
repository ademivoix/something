/*

Occam's Razor by Ademivoix

Adapted from a simple yet effective base strat by Manu

*/
var log = require('../core/log');
//var fsw = require('fs');
//var math = require('mathjs');

// Let's create our own strat
var strat = {
 stoplossCounter : 0,
 profitCounter : 0,
 lossCounter : 0,
};

// Prepare everything our method needs
strat.init = function() {
 this.input = 'candle';
 this.currentTrend = 'neutral';
 //this.requiredHistory = 0;
 this.requiredHistory = this.tradingAdvisor.historySize;
 //this.historySize = this.settings.history;

 var weight = this.settings.EMA.weight;
 this.percentUpper = this.settings.thresholds.percentUpper;
 this.percentLower = this.settings.thresholds.percentLower;
 this.profitMulti = this.settings.profitloss.profitMulti;
 this.takeLoss = this.settings.profitloss.takeLoss;

 this.addIndicator('myema', 'EMA', weight);
 //var period = this.settings.period;
 //this.addIndicator('mywma', 'WMA', period);
}

strat.onTrade = function(event) {
    this.prevAction = event.action; // store the previous action (buy/sell)
    this.prevPrice = event.price; // store the price of the previous trade
}

strat.check = function(candle) {

  var priceToWatch = this.indicators.myema.result;
	//var priceToWatch = this.indicators.mywma.result;
	//log.debug("Avg price: " + priceToWatch);

  if(this.currentTrend === 'neutral') {
      var lowLimit = priceToWatch *  ( 1 - this.percentLower / 100.0 );
      //log.debug("lowLimit: " + lowLimit);
      if ( candle.close < lowLimit ) {
        this.advice('long');
        this.currentTrend = 'long';
        log.debug("Going long at " + candle.close + " - under : " + lowLimit );
      }
  }

  if (this.currentTrend === 'long') {
    var highLimit = priceToWatch * ( 1 + this.percentUpper / 100.0);
    //log.debug("highLimit: " + highLimit);
    if (this.prevPrice > 0) {
      this.profit = (this.candle.close - this.prevPrice) / this.prevPrice * 100;
      //log.debug ('this.profit = ' + this.profit);
    } else {
      this.profit = 0;
    }

    if (this.profit != 0 && this.profit >= this.percentUpper + this.percentLower * this.profitMulti) {
      this.currentTrend = 'neutral';
      this.advice('short');
      log.debug("Taking profit at " + candle.close + " - above : " + this.prevPrice);
      this.profitCounter++;
    } else
      if (this.candle.close > highLimit) {
      this.currentTrend = 'neutral';
      this.advice('short');
      log.debug("Going short at " + candle.close + " - above : " + highLimit);
    }

    // cut our losses
    if (this.profit != 0 && this.settings.takeLoss != 0 && this.profit <= this.takeLoss) {
      this.currentTrend = 'neutral';
      this.advice('short');
      this.lossCounter++;
      log.debug("Taking a loss at " + candle.close + " - under : " + this.prevPrice );

    }
  }
}

strat.end = function() {
    //log.debug('Triggered stoploss',this.stoplossCounter,'times');
    log.debug('Took profit',this.profitCounter,'times');
    log.debug('Took a loss',this.lossCounter,'times');
}

module.exports = strat;
