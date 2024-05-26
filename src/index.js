const Swal = require('sweetalert2').default;
const axios = require('axios').default;
require('./style.css');



const pleaseEnterAValidAmount = `Please enter a valid amount, must be greater than 1 UGX`;
const enterAValidAccountNumber = `Please enter a phone number or account number`;
const selectPaymentMethod = `Please select a payment method`;
const fillRequiredFields = 'Please fill in all required fields';
const pleaseWait = "Please wait...";
const merchantCouldNotBeValidated = "Your merchant could not be validated, try again or contact support.";
const transactionSuccessful = 'Transaction successful';
const paymentMethodNotAvailable = 'Payment method not available';

const baseURL = 'https://gateway.gmpayapp.com/';
const signature = 'com.gmpayapp.webplugin';
const headerWithLogoHtml = `<div class="gm-logo"></div><p class="gm-motto">Your financial companion</p>`;
const footerHtml = '<a class="gm-text-button" id="showMerchantInfoButton" ><i class="ti ti-help"></i>About your merchant</a>';


/**
 * Represents the GMPay class for handling API requests and payment transactions.
 */
class GMPay {
    /**
     * The base URL for API requests.
     * @type {string}
     */

    merchantDetails = {};
    extraData = {};
    isCashOut = false;
    transactionStatus = {
        pending: 'pending',
        success: 'success',
        failed: 'failed',
        cancelled: 'cancelled'
    }
    Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });


    /**
     * Creates a new instance of the class.
     * Keys can be obtained from the GMPay merchant dashboard.
     * @param {string} publicKey - Your public key.
     * @param {string} privateKey - Your secret key.
     */
    constructor(publicKey, privateKey) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;

        this.instance = axios.create({
            baseURL: baseURL,
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': signature,
                'apiKey': `${this.publicKey}`,
                ...(this.privateKey && { 'secret': `${this.privateKey}` })
            }

        });
    }

    /**
     * Displays a loading dialog with a custom header and "Please wait..." text.
     * The loading dialog prevents interactions with the page until it is closed.
     */
    showLoading() {
        Swal.fire({
            title: this.headerWithLogoHtml,
            text: pleaseWait,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            },
        });
    }

    /**
     * Displays an error message using Swal.fire.
     * @param {string} message - The error message to be displayed.
     */
    errorOccurred(message) {
        Swal.fire({
            icon: 'error',
            title: this.headerWithLogoHtml,
            text: message,
        });
    }

    /**
     * Retrieves the merchant information.
     * @returns {Object|null} The merchant details if successful, otherwise null.
     */
    async getMerchantInfo() {
        this.showLoading();
        try {
            var result = await this.instance.post('merchant/info', { "apiKey": this.publicKey });
            if (result.data.data) {
                this.merchantDetails = result.data.data;
                return result.data.data;
            } else {
                this.errorOccurred(merchantCouldNotBeValidated)
            }
        } catch (error) {
            this.errorOccurred(this.getErrorMessage(error, merchantCouldNotBeValidated))
        }
    }

    /**
     * Retrieves the available payment methods.
     * @returns {Promise<Array>} A promise that resolves to an array of payment methods.
     */
    async getPaymentMethods() {
        this.showLoading();
        try {
            var result = await this.instance.get('modules/can-process-payment');

            if (result.data) {
                return result.data;
            } else {
                this.errorOccurred(paymentMethodNotAvailable);
            }

        } catch (error) {
            this.errorOccurred(this.getErrorMessage(error, paymentMethodNotAvailable))
        }
    }


    /**
     * Generates a payment template HTML string.
     * 
     * @param {Array} methods - An array of payment methods.
     * @param {string} phoneNumber - The phone number.
     * @param {number} amount - The payment amount.
     * @returns {string} The payment template HTML string.
     */
    getPaymentTemplate(methods, phoneNumber, amount) {
        return `<div class="gm-payment-form">
                <label for="account" >Account</label>
                <input type="text" id="account" name="account" placeholder="Enter phone number or GMPay account" value='${phoneNumber}'>
                <label for="amount">Amount</label>
                <input type="text" id="amount" name="amount" value="${Number(amount).toLocaleString()}">
                <label for="paymentMethod">Payment Method</label>
                <select  id="paymentMethod" name="paymentMethod">
                    <option>Select Payment Method</option>
                    ${methods.map(method => `<option value="${method.module}">${method.optionName}</option>`)}
                </select>
                <div id="extra-input" class="gm-payment-form p0m0"></div>
            </div>`;
    }

    /**
     * Returns a template for the withdrawal form.
     * 
     * @param {string} phoneNumber - The phone number associated with the account.
     * @param {number} amount - The withdrawal amount.
     * @returns {string} - The HTML template for the withdrawal form.
     */
    getWithdrawTemplate(phoneNumber, amount) {
        return `<div class="gm-payment-form">
                <label for="amount">Amount</label>
                <input type="text" id="amount" name="amount"  value="${Number(amount).toLocaleString()}">
                <label for="account">Account</label>
                <input type="text" id="account" name="account"  value="${phoneNumber}">
                <div id="extra-input" class="gm-payment-form p0m0"></div>
                <div class="gm-info">
                    <h4 class="gm-info-label"><i class="ti ti-info-circle-filled"></i>Info</h4>
                    <small class="gm-info-value">
                        Cash will be sent on provided GMPay account only, if you do not have a GMPay account, please create one.
                    </small>
                </div>
            </div>`;
    }

    /**
     * Displays a temporary success message using Swal.fire.
     * @param {string} message - The success message to be displayed.
     * @returns {Promise<void>} - A promise that resolves when the success message is displayed.
     */
    async showTempSuccess(message) {
        await Swal.fire({
            icon: 'success',
            title: this.headerWithLogoHtml,
            text: message,
            timer: 5000,
            showCloseButton: false
            ,
            timerProgressBar: true,
            allowOutsideClick: false,
        });
    }

    /**
     * Displays a success message using Swal.fire.
     * @param {string} message - The success message to be displayed.
     * @returns {Promise<void>} - A promise that resolves when the success message is displayed.
     */
    async showSuccess(message) {
        await Swal.fire({
            icon: 'success',
            title: this.headerWithLogoHtml,
            text: message,
        });
    }

    /**
     * Presents a payment dialog to the user.
     * 
     * @param {string} account - The account number or phone number for the payment.
     * @param {number} amount - The amount of the payment.
     * @param {string} reference - The reference for the payment.
     * @param {object} metadata - Additional metadata for the payment.
     * @param {function} callback - The callback function to be executed after the payment is completed.
     * @returns {Promise<any>} - A promise that resolves with the result of the payment.
     */
    async presentPaymentDialog(account, amount, reference, metadata, callback) {
        if (!this.account) {
            this.account = account;
            this.amount = amount;
            this.reference = reference
            this.metadata = metadata;
            this.callback = callback;
        }

        const methods = await this.getPaymentMethods();

        let result = await Swal.fire({
            title: headerWithLogoHtml,
            html: this.getPaymentTemplate(methods, this.account, this.amount),
            confirmButtonText: 'Proceed',
            denyButtonText: 'Cancel',
            showDenyButton: true,
            footer: this.merchantDetails.businessName ? footerHtml : null,

            didOpen: () => {
                if (this.merchantDetails.businessName) {
                    document.getElementById('showMerchantInfoButton').addEventListener('click', () => {
                        this.showMerchantInfo();
                    });
                }

                document.getElementById('account').addEventListener('input', (e) => {
                    this.account = e.target.value;
                });


                document.getElementById('paymentMethod').addEventListener('change', (e) => {
                    const method = methods.find(method => method.module === e.target.value);
                    let extraInput = document.getElementById('extra-input');

                    extraInput.innerHTML = '';
                    this.paymentMethod = method;

                    var descElement = document.getElementById('methodDescription');
                    if (descElement) {
                        descElement.remove();
                    }

                    //attach description below the select
                    if (method && method.description) {
                        var descElement = document.createElement('small');
                        descElement.setAttribute('id', 'methodDescription');
                        descElement.innerHTML = method.description;
                        descElement.style.marginBottom = '5px';
                        document.getElementById('paymentMethod').insertAdjacentElement('afterend', descElement);
                    }

                    if (method) {
                    
                        if (method.extraFields) {

                            extraInput.innerHTML = '';
                            method.extraFields.forEach(field => {
                                var labelElement = document.createElement('label');
                                labelElement.setAttribute('for', field.key);
                                labelElement.innerHTML = field.label + (field.required ? ' (required)' : '(Optional)');
                                extraInput.appendChild(labelElement);

                                if (field.required && field.key != 'account') {
                                    this.extraData[field.key] = null;
                                }

                                if (field.type === 'Input') {

                                    var inputElement = document.createElement('input');
                                    inputElement.setAttribute('type', field.type);
                                    inputElement.setAttribute('id', field.key);
                                    inputElement.setAttribute('name', field.key);
                                    inputElement.setAttribute('placeholder', field.placeholder ?? '');
                                    if (field.key === 'account') {
                                        inputElement.setAttribute('value', this.account);
                                    } else {
                                        inputElement.setAttribute('value', field.value ?? '');
                                    }
                                    inputElement.addEventListener('input', (e) => {
                                        this.extraData[field.key] = e.target.value;
                                    }
                                    );
                                    extraInput.appendChild(inputElement);
                                } else if (field.type === 'Select') {
                                    var selectElement = document.createElement('select');
                                    selectElement.setAttribute('id', field.key);
                                    selectElement.setAttribute('name', field.key);
                                    var optionElement = document.createElement('option');
                                    optionElement.innerHTML = "Select an option";
                                    selectElement.appendChild(optionElement);
                                    field.items.forEach(option => {
                                        var optionElement = document.createElement('option');
                                        optionElement.setAttribute('value', option.value);
                                        optionElement.innerHTML = option.label;
                                        selectElement.appendChild(optionElement);
                                    });
                                    selectElement.addEventListener('change', (e) => {
                                        this.extraData[field.key] = e.target.value;
                                    })

                                    extraInput.appendChild(selectElement);
                                }

                            });
                        }

                        if (method.otpMethod) {
                            //add  otp input
                            var otpInput = document.createElement('input');
                            otpInput.setAttribute('type', 'text');
                            otpInput.setAttribute('id', 'otp');
                            otpInput.setAttribute('name', 'otp');
                            otpInput.setAttribute('placeholder', 'Enter OTP');
                            otpInput.setAttribute('required', true);
                            extraInput.appendChild(otpInput);

                            this.extraData['otp'] = null;

                            //add otp button
                            var otpButton = document.createElement('button');
                            otpButton.setAttribute('id', 'otpButton');
                            otpButton.classList.add('swal2-input');
                            otpButton.style.width = '100%';
                            otpButton.innerHTML = 'Request OTP';
                            otpButton.addEventListener('click', async () => {
                                try {
                                    Swal.showValidationMessage("Sending OTP...")
                                    var otpResult = await this.instance.post(`api/v4/transactions/${method.module}/${method.otpMethod}`, { metadata: { account: this.account, amount: this.amount } });
                                    if(otpResult.data?.success){

                                        Swal.showValidationMessage("OTP sent successfully");
                                    }else{
                                        Swal.showValidationMessage(otpResult.data?.message || "Could not send OTP try again later");
                                    }
                                } catch (error) {
                                    this.errorOccurred(this.getErrorMessage(error));
                                }
                            });

                            extraInput.appendChild(otpButton);
                        }else{
                            delete this.extraData['otp'];
                        }

                    }
                });


                document.getElementById('amount').addEventListener('input', (e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    const val = Number(numericValue);
                    this.amount = val;
                    e.target.value = val.toLocaleString();;
                });
            },
            preConfirm: () => {

                //if extra data has a key that is required and the value is null, show error
                for (const key in this.extraData) {
                    if (this.extraData.hasOwnProperty(key)) {
                        const value = this.extraData[key];
                        if (value === null) {
                            Swal.showValidationMessage(
                                fillRequiredFields
                            )
                            return false;
                        }
                    }
                }

                if (!this.paymentMethod) {
                    Swal.showValidationMessage(
                        selectPaymentMethod
                    )
                }
                if (!this.amount || this.amount < 1) {
                    Swal.showValidationMessage(
                        pleaseEnterAValidAmount
                    )
                }
                if (!this.account) {
                    Swal.showValidationMessage(
                        enterAValidAccountNumber
                    )
                }

                if (this.paymentMethod && this.amount && this.amount > 0 && this.account) {
                    return true;
                } else {
                    return false;
                }


            }
        });


        try {
            if (result.isConfirmed && result.value) {

                this.showLoading();


                let payload = {
                    metadata: {
                        "amount": this.amount,
                        "account": this.account,
                        "reference": this.reference,
                        ...(metadata && { "metadata": metadata }),
                        ...this.extraData
                    }
                }

                var paymentResult = await this.instance.post(`api/v4/transactions/${this.paymentMethod.module}/${this.paymentMethod.methodName}`, payload);


                if (paymentResult?.data?.data?.redirect_url) {
                    this.approval_url = paymentResult.data.data.redirect_url;
                    await this.showTempSuccess('Payment successful, redirecting to payment page to complete transaction');
                    //open url in new tab
                    window.open(paymentResult.data.data.redirect_url, '_blank');
                    this.doCallback(this.transactionStatus.pending);
                    return null;
                }else{
                    await this.showTempSuccess(this.getMessageFromServerResult(paymentResult));
                }


            }

            if (result.isDenied) {
                this.doCallback(this.transactionStatus.cancelled
                );
            }

        } catch (error) {
            this.errorOccurred(this.getErrorMessage(error))
            return null;
        }

    }

    /**
     * Presents a withdraw dialog for the user to enter withdrawal details and initiate a payment.
     * 
     * @param {string} account - The account number or phone number for the withdrawal.
     * @param {number} amount - The amount to withdraw.
     * @param {string} reference - The reference for the withdrawal.
     * @param {object} metadata - Additional metadata for the withdrawal.
     * @param {function} callback - The callback function to execute after the withdrawal is completed.
     * @returns {Promise<null>} - A promise that resolves to null.
     */
    async presentWithdrawDialog(account, amount, reference, metadata, callback) {
        this.isCashOut = true;
        if (!this.account) {
            this.account = account;
            this.amount = amount;
            await this.getMerchantInfo();
            this.reference = reference
            this.metadata = metadata;
            this.callback = callback;
        }


        let result = await Swal.fire({
            title: this.headerWithLogoHtml,
            html: this.getWithdrawTemplate(this.account, this.amount),
            confirmButtonText: 'Proceed',
            denyButtonText: 'Cancel',
            showDenyButton: true,
            footer: footerHtml,

            didOpen: () => {
                document.getElementById('showMerchantInfoButton').addEventListener('click', () => {
                    this.showMerchantInfo();
                });
                document.getElementById('amount').addEventListener('input', (e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    const val = Number(numericValue);
                    this.amount = val;
                    e.target.value = val.toLocaleString();;
                });

                document.getElementById('account').addEventListener('input', (e) => {
                    this.account = e.target.value;
                });
            },
            preConfirm: () => {

                if (!this.amount || this.amount < 1) {
                    Swal.showValidationMessage(
                        pleaseEnterAValidAmount
                    )
                }
                if (!this.account) {
                    Swal.showValidationMessage(
                        enterAValidAccountNumber
                    )
                }

                if (this.amount && this.amount > 0 && this.account) {
                    return true;
                } else {
                    return false;
                }
            }
        });

        try {
            if (result.isConfirmed && result.value) {

                if (!this.reference) {
                    this.reference = this.makeReference(this.merchantDetails.merchant.businessName);
                }

                this.showLoading();

                let payload = {
                    "amount": this.amount,
                    "account": this.account,
                    "reference": this.reference,
                    ...(metadata && { "metadata": metadata }),
                    "method": "wapp"
                }

                var paymentResult = await this.instance.post('transactions/web-payment', payload);

                let message = this.getMessageFromServerResult(paymentResult);
                await this.showTempSuccess(message);

            }

            if (result.isDenied) {
                this.doCallback(this.transactionStatus.cancelled);
            }

        } catch (error) {
            this.errorOccurred(this.getErrorMessage(error))
        }
    }

    getErrorMessage(error, fallbackMessage) {
        console.log(error);
        if (error.response && error.response.data && error.response.data.message) {
            return error.response.data.message || error.response.data.error;
        } else {
            return fallbackMessage || "Something went wrong, could not process your request.";
        }
    }

    getMessageFromServerResult(paymentResult) {
        if (paymentResult.data.message) {
            return paymentResult.data.message;
        } else if (paymentResult.data.data && paymentResult.data.data.message) {
            return paymentResult.data.data.message;
        } else {
            return "Operation successful";
        }
    }

    /**
     * Refreshes the transaction status by periodically checking the status of a transaction using its reference.
     * If the transaction status is 'success', it displays a success message and performs a callback.
     * If the transaction status is 'failed', it displays an error message and performs a callback.
     * If the transaction status is 'pending', it displays a message indicating that the transaction is still pending.
     * If the transaction status is any other value, it displays an error message and performs a callback.
     * If an error occurs during the process, it displays an error message and returns null.
     * @param {string} reference - The reference of the transaction to check.
     */
    async refreshTransactionStatus(reference) {
        try {
            let interval = setInterval(async () => {

                var result = await this.instance.get(`transactions/check/${reference}`);
                console.log('result', result);
                if (result.data.data.status) {
                    if (result.data.data.status === this.transactionStatus.success) {
                        clearInterval(interval);
                        await this.showSuccess(transactionSuccessful);
                        this.doCallback(this.transactionStatus.success);
                    } else if (result.data.data.status === this.transactionStatus.failed) {
                        clearInterval(interval);
                        this.errorOccurred("Your transaction failed, try again or contact support.");
                        this.doCallback(this.transactionStatus.failed);
                    } else if (result.data.data.status === this.transactionStatus.pending) {
                        this.status = this.transactionStatus.pending;
                        Swal.showValidationMessage(
                            `Your transaction is still in pending be patient...`
                        )
                    } else {
                        clearInterval(interval);
                        this.errorOccurred("Your transaction could not be validated, try again or contact support.")
                        this.doCallback(this.transactionStatus.pending);
                    }
                } else {
                    clearInterval(interval);
                    this.errorOccurred("Your transaction could not be validated, try again or contact support.")
                    this.doCallback(this.transactionStatus.pending);
                }

            }, 5000);


            let result = await Swal.fire({
                title: this.headerWithLogoHtml,
                text: "Validating transaction, validation may take some time so please be patient...",
                didOpen: () => {
                    Swal.showLoading()
                },
            })


            if (result.isDismissed && result.dismiss === Swal.DismissReason.backdrop) {
                clearInterval(interval);
                this.doCallback(this.transactionStatus.pending);
            }

        } catch (error) {
            clearInterval(interval);
            this.doCallback(this.transactionStatus.pending);
            this.errorOccurred(this.getErrorMessage(error))
        }
    }

    /**
     * Executes the callback function with the specified status.
     * @param {string} status - The status of the callback.
     * @returns {void}
     */
    doCallback(status) {
        if (this.callback) {
            this.callback({
                reference: this.reference,
                amount: this.amount,
                account: this.account,
                status: status,
                approval_url: this.approval_url,
            });
        }
    }


    /**
     * Generates a reference string based on the company name and method.
     * @param {string} companyName - The name of the company.
     * @param {string|null} method - The payment method (optional).
     * @returns {string} The generated reference string.
     */
    makeReference(companyName, method) {
        return `${companyName.replace(' ', '')}-${method != null ? method : ''}-${new Date().getTime()}`;
    }

    /**
     * Displays the merchant information in a modal dialog.
     * If the merchant details are not available, it retrieves them using the getMerchantInfo method.
     * If the merchant details are still not available, it shows an error message.
     * The merchant information includes the business name and merchant email.
     * After displaying the merchant information, it presents a payment dialog if the user confirms.
     */
    async showMerchantInfo() {
        if (!this.merchantDetails) {
            await this.getMerchantInfo();
        }

        if (!this.merchantDetails) {
            this.errorOccurred(merchantCouldNotBeValidated)
            return null;
        }

        Swal.fire({
            title: this.headerWithLogoHtml,
            confirmButtonText: 'Close',
            html: `
            <div class="gm-merchant-info">
                <div class="gm-merchant-info-item">
                    <h4 class="gm-merchant-info-item-label">Business</h4>
                    <div class="gm-merchant-info-item-value"><i class="ti ti-building-bank"></i>${this.merchantDetails.merchant.businessName}</div>
                </div>
                <div class="gm-merchant-info-item">
                    <h4 class="gm-merchant-info-item-label">Merchant Email</h4>
                    <div class="gm-merchant-info-item-value"><i class="ti ti-mail"></i><a href="mailto:${this.merchantDetails.merchant.user.email}">${this.merchantDetails.merchant.user.email}</a></div>
                </div>

                <div class="gm-info">
                    <h4 class="gm-info-label"><i class="ti ti-info-circle-filled"></i>Info</h4>
                    <small class="gm-info-value">
                        For more information about this merchant, please contact them directly via the email address provided above.
                    </small>
                </div>
            </div>
            `,
        }).then((result) => {
            if (result.isConfirmed) {
                if (!this.isCashOut) {

                    this.presentPaymentDialog();
                } else {
                    this.presentWithdrawDialog();

                }
            }
        });
    }

    /**
     * Displays a toast message.
     * @param {string} message - The message to be displayed in the toast.
     */
    toast(message) {

        this.Toast.fire({
            icon: "success",
            title: message
        });
    }

}



module.exports = GMPay;