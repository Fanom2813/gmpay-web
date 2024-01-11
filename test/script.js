const GMPay = require('gmpay');

const gmpay = new GMPay("Key", "Secret");
gmpay.presentPaymentDialog('+256700000', 1000, null, null, function(result) {
    console.log(result);
});

gmpay.presentWithdrawDialog('+256700000', 1000, null, null, function(result) {
    console.log(result);
});