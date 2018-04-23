'use strict';
var BigNumber = require('bignumber.js');

var hucUnits = function() {}
hucUnits.unitMap = {
	"nohuc": "0",
    "wei": "1",
    "kwei": "1000",
    "mwei": "1000000",
    "gwei": "1000000000",
    "twei": "1000000000000",
    "pwei": "1000000000000000",
    "huc": "1000000000000000000",
    "khuc": "1000000000000000000000",
    "mhuc": "1000000000000000000000000",
    "ghuc": "1000000000000000000000000000",
    "thuc": "1000000000000000000000000000000",
    "phuc": "1000000000000000000000000000000000",
    "ehuc": "1000000000000000000000000000000000000",
    "zhuc": "1000000000000000000000000000000000000000",
    "yhuc": "1000000000000000000000000000000000000000000",
    "nhuc": "1000000000000000000000000000000000000000000000",
    "dhuc": "1000000000000000000000000000000000000000000000000",
    "vhuc": "1000000000000000000000000000000000000000000000000000",
    "uhuc": "1000000000000000000000000000000000000000000000000000000",
};
hucUnits.getValueOfUnit = function(unit) {
	unit = unit ? unit.toLowerCase() : 'huc';
	var unitValue = this.unitMap[unit];
	if (unitValue === undefined) {
		throw new Error(globalFuncs.errorMsgs[4] + JSON.stringify(this.unitMap, null, 2));
	}
	return new BigNumber(unitValue, 10);
}
hucUnits.fiatToWei = function(number, pricePerHuc) {
	var returnValue = new BigNumber(String(number)).div(pricePerHuc).times(this.getValueOfUnit('huc')).round(0);
	return returnValue.toString(10);
}

hucUnits.toFiat = function(number, unit, multi) {
	var returnValue = new BigNumber(this.toHuc(number, unit)).times(multi).round(5);
	return returnValue.toString(10);
}

hucUnits.toHuc = function(number, unit) {
	var returnValue = new BigNumber(this.toWei(number, unit)).div(this.getValueOfUnit('huc'));
	return returnValue.toString(10);
}

hucUnits.toWei = function(number, unit) {
	var returnValue = new BigNumber(String(number)).times(this.getValueOfUnit(unit));
	return returnValue.toString(10);
}

module.exports = hucUnits;