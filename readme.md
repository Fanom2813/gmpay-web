# GMPay

GMPay opens up a world of boundless opportunities for businesses of all sizes, industries and individuals.

### Overview

GMPay is a JavaScript library that provides a simple way to integrate GMPay mobile payments into your web applications. It allows you to easily initiate payment transactions and send funds with minimal effort. here is a guide on how to use the GMPay package in your project.

### 1. Installation

To use GMPay in your project, you need to install it via NPM. Open your terminal and run the following command:

```bash
npm install gmpay
```

### Usage

After installing the package, you can integrate GMPay into your HTML and JavaScript code. Here is a step-by-step guide using an example HTML file:

### 2. Import and Initialization

```javascript
// Import the GMPay module
const GMPay = require('gmpay');

// Initialize GMPay with your API key and API secret
const gmpay = new GMPay("YOUR_API_KEY", "YOUR_API_SECRET");
```

Replace `"YOUR_API_KEY"` and `"YOUR_API_SECRET"` with your actual GMPay API key and API secret.


### 3. Present Payment Dialog

The `presentPaymentDialog` method is used to present a payment dialog to the user. This method facilitates the initiation of a payment transaction. Below is the detailed documentation for this method:

#### Method Signature

```javascript
presentPaymentDialog(account: string, amount: number, reference: string, metadata: any, callback: Function): Promise<any>
```

### Parameters

* **`account` (string):** The account number or phone number to which the payment will be made.
* **`amount` (number):** The amount of the payment.
* **`reference` (string):** The reference for the payment. It serves as a unique identifier for tracking the transaction.
* **`metadata` (any):** Additional metadata for the payment. This can include any extra information related to the transaction, you can set json here , will be posted to your callback once payment is successfull.
* **`callback` (Function):** The callback function to be executed after the payment is completed. This function receives the result of the payment as its parameter.

### Returns

* **`Promise<any>`:** just await until dialog is closed the promise resolves to null.

#### Example Usage

```javascript
gmpay.presentPaymentDialog('+256700000', 1000, null, null, function(result) {
    console.log(result);
});
```

### Notes

* Ensure that the`account` parameter represents the correct destination for the payment.
* The`metadata` parameter is optional and can be used to include any additional contextual information.
* The`callback` function is executed once the payment is completed.
* Use the returned promise to handle asynchronous resolution of the payment result.


### 4. Present Withdraw Dialog

The `presentWithdrawDialog` method is designed to present a withdrawal dialog to the user, facilitating the initiation of a fund withdrawal (sending funds to user). Below is a detailed documentation for this method:

#### Method Signature

```javascript
presentWithdrawDialog(account: string, amount: number, reference: string, metadata: any, callback: Function): Promise<null>
```

### Parameters

* **`account` (string):** The account number or phone number from which the funds will be withdrawn.
* **`amount` (number):** The amount to be withdrawn.
* **`reference` (string):** The reference for the withdrawal. It serves as a unique identifier for tracking the transaction.
* **`metadata` (any):** Additional metadata for the withdrawal. This can include any extra information related to the transaction.
* **`callback` (Function):** The callback function to be executed after the withdrawal is completed. This function receives the result of the withdrawal as its parameter.

### Returns

* **`Promise<null>`:** A promise that resolves to`null`. The promise is used to indicate the completion of the withdrawal.


#### Example Usage

```javascript
gmpay.presentWithdrawDialog('+256700000', 1000, null, null, function(result) {
    console.log(result);
});
```

### Notes

* Ensure that the `account` parameter represents the correct source for the withdrawal.
* The `metadata` parameter is optional and can be used to include any additional contextual information.
* The `callback` function is executed once the withdrawal is completed.
* Use the returned promise to handle asynchronous resolution indicating the completion of the withdrawal.


### 5. Result Callback

The provided callback function will be executed once the payment or withdrawal process is completed. The `result` object contains information about the transaction.


#### Callback Result Structure

The callback result is an object containing information about a payment or withdrawal transaction. Here's a breakdown of the properties within the result object:

* **reference** : The unique reference identifier for the transaction. It helps identify and track the specific transaction.
* **amount** : The amount involved in the transaction. It represents the monetary value of either the payment or withdrawal.
* **account** : The phone number / account associated with the transaction. It could be the recipient's or sender's account, depending on whether it's a payment or withdrawal.
* **status** : The status of the transaction, indicating whether it was successful, pending, or encountered an issue. The `status` parameter is presumably a variable that holds this information.
* **approval_url** : In the context of the payment, this could be a URL leading to a page where the user can approve or verify the transaction. This URL might be relevant for additional authentication or confirmation steps.

### Example Result Object:

```javascript
{
    reference: "ABC123",
    amount: 1000,
    account: "+256700000",
    status: "success",
    approval_url: "https://example.com/approve-payment",
}
```

### Transaction Status

#### Overview

The `transactionStatus` object is a predefined set of status values that represent different states a transaction can be in. Each status value is associated with a descriptive string.

#### Object Structure

```javascript
const transactionStatus = {
    pending: 'pending',
    success: 'success',
    failed: 'failed',
    cancelled: 'cancelled'
};
```

### Status Values

* **`pending`:** Indicates that the transaction is in a pending state, implying that it has been initiated but not yet completed.
* **`success`:** Represents a successful completion of the transaction, indicating that the operation was executed without issues.
* **`failed`:** Denotes that the transaction encountered an error or some other issue, resulting in a failure.
* **`cancelled`:** Indicates that the transaction was intentionally cancelled before completion.


## Use in your HTML / Front-End


#### 1. Include GMPay script

Add the GMPay script to your HTML file. Ensure that the path is correct based on your project structure.

```html
<script src="https://unpkg.com/gmpay@latest/dist/bundle.js"></script>
```


#### 2. Initialize GMPay

Create an instance of the GMPay class by providing your API key and API secret.

```javascript
const payment = new GMPay("YOUR_API_KEY", "YOUR_API_SECRET");
```

Replace `"YOUR_API_KEY"` and `"YOUR_API_SECRET"` with the actual API key and API secret provided by GMPay.

#### 3. Implement Payment

Use the `presentPaymentDialog` function to initiate a payment transaction.

```javascript
function payNow() {
    const phoneNumber = document.querySelector('input[name="phoneNumber"]').value;
    const amount = document.querySelector('input[name="amount"]').value;

    payment.presentPaymentDialog(phoneNumber, amount, null, null, function (result) {
        console.log("Received callback:", result);
    });
}
```

#### 4. Implement Withdrawal

Use the `presentWithdrawDialog` function to initiate a fund withdrawal.

```javascript
function sendFunds() {
    const phoneNumber = document.querySelector('input[name="phoneNumber"]').value;
    const amount = document.querySelector('input[name="amount"]').value;

    payment.presentWithdrawDialog(phoneNumber, amount, null, null, function (result) {
        console.log("Received callback:", result);
    });
}
```

#### 5. Run the Example

Open your HTML file in a browser and test the payment and withdrawal functionalities.

### 6. Important Note

Ensure to keep your API key and API secret secure. Avoid exposing them directly in your code or sharing them publicly.

### 7. Run the Script

Execute your Node.js script to test the payment and withdrawal functionalities.

```bash
node your_script_name.js
```
