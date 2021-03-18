// const { json } = require("body-parser");
// const { ServerResponse } = require("node:http");

// variable to hold the db connection
let db;
// establish a connection to IndexedDb db called 'budget' and set the version to 1
const request = indexedDB.open('budget', 1);

// This will run if there is a db version change
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store or table 'new_transaction', have it auto increment
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// when there is a successful db creation
request.onsuccess = function(event) {
    // when db is successfully created with its object store
    db = event.target.result;

    // check if app is online, if yes run uploadTransaction() function and send all local data to api
    if (navigator.online) {
        uploadTransaction();
    }
};

// if there is an error
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// if we attempt to log a new transaction offline
function saveRecord(record) {
    // open a new transaction with the database with read and write permission
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for 'new_transaction'
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add method
    transactionObjectStore.add(record);
};

// upload the transaction
function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    // upon successful get all, run this fuction
    getAll.onsuccess = function() {
        // if there was data in indexedDB's store, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.results),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access the new_transaction object store
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear all items in your store
                transactionObjectStore.clear();

                alert('All saved transactions have been uploaded!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);