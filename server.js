const express = require("express");
var pdf = require("html-pdf");
const jose = require("node-jose");
const fetch = (...args) => import ('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

const port = process.env.PORT || 4000;

// Inital values for test, can be changed by url params
var url = `https://credstore.cfapps.us10.hana.ondemand.com/api/v1/credentials`;
var credenials = {
    username: "b2bec4c5-5570-43e2-ac82-b05b00367eba.0.FPGNj5dIJNn0ybMW8ChCnD97n3MxLagPctMccpnWx3A=",
    password: "GBMRIrwqTZplzWULykKveMcpS3BtKayFuQGhhBfg36CbCLe4DcmFWdYmG4WPFELm.0.S+Vial011wOHiBSXDB5xhXlqTCaCaHIeJKHYgld93pU="
};
var type = 'password';
var name = 'testpas';
var privateKey = "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCL7SI3wwSm1XIfx/8pGtQ2iyngouLYcbHTTvsmgWTRz1nJ5upO2RBEN7LLU5IPD3XRwOtk0ofI9xVocMj6GSV2WteH0pE2o3Ma0CssjFQDL+u51AIpyHHmMy7DPi3L/9jf1WG1JjlG7ouVyuEhQrXQF2hnvgWX1UpwgRmNqWLL0C1B89GTyOMOdq6Tq12c3L/QVAysdeVcB4OmN7zv/MJzqO3ot9U5WoqOeKI4KOVOXWuR2FSHJ8q06L20j7EkAENWRzfRCG5+8eE8B89JOKh1Ja6Wu6citio5aGqo9/KpAiGk9D9W7jV/a4OCTZYLgOANaGVx9P42tduPVLN4sGuVAgMBAAECggEAY4+D5Fc/rRF8lX5xYKb1TiXw0yQy8jzbgXXWH8y7lsnJom5KU3YBK/jRn/jDmTGv7GIvW1qtQOIF+n0dk05nKHJ0nvDFYDImiXKK9bSXZnknad6e92nnGRtb75IDdf6CKqmiTwl2gbDj4t4rF8ZmpTyyjfZX9nPN9oT1UKWwZUGZgGJPmoevBjBygg+YGhPKIr0RF8lwhySuIHdaNwX8nC9sfHZM0YJDmUAX3tdPeIjWvxaZ4M5cBgmCaB2VB3f0sFDhWgwSph6+eVJkvAAbScBhsAyz50af41gXCJh/MR5hee6kAv4BwZ410YuzBiFu6/lrKQS4e49mJiYhNhia9QKBgQDMYsUkvcLZfyLOxchfmuc0CaFCw4pIY52Fp+MZpcxiJxHoqlrr8KsVx7xH/YYDNwX0eBsKcOFg99ohUUTiCK9enssVAuKsfoz2qyQfNRjJ8e+C0nAKMvfSxaVKhLUbNLEFOxYkjEjlk0gcl/YaugLvmPw33Z6wYprUOQZuLEEc+wKBgQCvQyeVDfsMiqXL3LKp5J8mbfVYBFhUADKUvXheMRUe6zy2mIT4N7ArVFgcjN5ewF0CLUVGUC5q5nK0u3AzMs6xoEra2AsgwDcKERRcbTtqfVQHNmxHO88Ot2+7U6AItNpjb061YOS9DvMyvZoCxC3c+AZbHw/0HGLqRqnYjZ4UrwKBgQCWVjiI1AQVE4045waCPGDASC0T/N0kbhGaFGnZnbj+oZpst5H1ZquRc7+sfHEswDZjIk1RmsJNH0KVqz+tu5GzWb4rkFnHY7awYiZJxjabpJf2dG/xMJhVswfoDkFg55smK9YXwBCGvZUXYzelZRlvv+oV9bAaMg2M+P0f4PFsLQKBgHu+3bbHfUeYqYGsXVXJf3mBz+YKg1ckIJKWyOMwoqoHDAIc5F3h6/hcAC6AZA3goosD7dK8kFmYRstHQOxVZk1SUSf9vLWuIe5wqsCru3Tv8qF5ErClEQhiCnjojak4EK5+i8NTG45FfP+JkbF8VKmdUdeKshf45vplVEz7iO8vAoGBAIArFdW2G9HnsQL5xxOO0Sh2t0ZFC02x2zeAksgBBZ9oG6kdq3sZ1dX+vpPD8ed8aXuht0S+/kO+l5XJpjtG4xhvvlYC1bCmg8jU20FsmLyah0jNSW2FeyV0Jtsxz5VDITzSsvDaFIUn8s+UAmotMbez60uKYXOO7MQXdOCKD9ZF";
//

async function readCredential(namespace, url, privateKey, credenials) {
    let credenialsBase64 = Buffer.from(`${
        credenials.username
    }:${
        credenials.password
    }`).toString("base64");

    return fetch(url, {
        method: "get",
        headers: {
            'sapcp-credstore-namespace': namespace,
            'Cache-Control': 'no-cache',
            'Authorization': `Basic ${credenialsBase64}`
        }
    }).then(checkStatus).then(response => response.text()).then(payload => decryptPayload(privateKey, payload)).then(JSON.parse);
}

function checkStatus(response) {
    if (! response.ok) 
        throw Error("Unexpected status code: " + response.status);
    


    return response;
}

async function decryptPayload(privateKey, payload) {
    const key = await jose.JWK.asKey(`-----BEGIN PRIVATE KEY-----${privateKey}-----END PRIVATE KEY-----`, "pem", {
        alg: "RSA-OAEP-256",
        enc: "A256GCM"
    });
    const decrypt = await jose.JWE.createDecrypt(key).decrypt(payload);
    const result = decrypt.plaintext.toString();
    return result;
}

app.use("/", async (req, res) => {
    if (typeof process.env.VCAP_SERVICES != 'undefined') { // If APP is running on BTP

        var binding = JSON.parse(process.env.VCAP_SERVICES).credstore[0].credentials;

        url = binding.url

        credenials.username = binding.username;
        credenials.password = binding.password;

        privateKey = binding.encryption.client_private_key;
        console.log(process.env);
    }

    if (typeof req.query.type != 'undefined' && typeof req.query.name != 'undefined') {
        type = req.query.type;
        name = req.query.name;
    }
    const namespace = 'PoC';

    const urlWithParams = `${
        url
    }/${type}?name=${name}`;


    console.log(urlWithParams);

    if (typeof name != 'undefined') 

        res.send(await readCredential(namespace, urlWithParams, privateKey, credenials));
    

});

app.listen(port, function () {
    console.log(`listening on port ${port}`);
});
