import {expect} from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import * as RequestEnum from '../../src/enum';
import RequestLogic from '../../src/requestLogic';
import CryptoUtils from '../../src/utils/crypto';

// payee id
const payeeRaw = { address: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
    privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
    publicKey: '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422' };

// payer id
const payerRaw =  { address: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
    privateKey: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
    publicKey: '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9' };

// another id
const otherIdRaw =  { address: '0x818B6337657A23F58581715Fc610577292e521D0',
    privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
    publicKey: 'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d' };

const arbitraryExpectedAmount = '123400000000000000';

/* tslint:disable:no-unused-expression */
describe('requestLogic.formatCreate()', () => {
    it('can create with only the payee', () => {
        const txCreation = RequestLogic.formatCreate({
                currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                expectedAmount: arbitraryExpectedAmount,
                payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
            },
            {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey},
        );

        expect(txCreation, 'txCreation.transaction is wrong').to.have.property('transaction');
        expect(txCreation.transaction.action, 'action is wrong').to.equal(RequestEnum.REQUEST_LOGIC_ACTION.CREATE);
        expect(txCreation.transaction, 'txCreation.transaction.parameters is wrong').to.have.property('parameters');

        expect(txCreation.transaction.parameters.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
        expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(arbitraryExpectedAmount);
        expect(txCreation.transaction.parameters.extensions, 'extensions is wrong').to.be.undefined;
        expect(txCreation.transaction.parameters.payer, 'payer is wrong').to.be.undefined;

        expect(txCreation.transaction.parameters, 'txCreation.transaction.parameters.payee is wrong').to.have.property('payee');
        expect(txCreation.transaction.parameters.payee.type, 'txCreation.transaction.parameters.payee.type is wrong').to.equal(RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
        expect(txCreation.transaction.parameters.payee.value, 'txCreation.transaction.parameters.payee.value is wrong').to.equal(payeeRaw.address);

        expect(txCreation, 'txCreation.signature is wrong').to.have.property('signature');
        expect(txCreation.signature.method, 'txCreation.signature.method is wrong').to.equal(RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA);
        expect(txCreation.signature.value, 'txCreation.signature.value').to.equal('0x32146780652ad2b5337891032c8de0079d3e4a8a7a9616d3a88de92dbc29f2d65bde479254bc3d18c6860cb04469f9f00eccea4b0a0d8a00d7f0a930f234e0781c');
    });

    it('can create with only the payer', () => {
        const txCreation = RequestLogic.formatCreate({
                currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                expectedAmount: arbitraryExpectedAmount,
                payer: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payerRaw.address},
            },
            {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey},
        );

        expect(txCreation, 'txCreation.transaction is wrong').to.have.property('transaction');
        expect(txCreation.transaction.action, 'action is wrong').to.equal(RequestEnum.REQUEST_LOGIC_ACTION.CREATE);
        expect(txCreation.transaction, 'txCreation.transaction.parameters is wrong').to.have.property('parameters');

        expect(txCreation.transaction.parameters.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
        expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(arbitraryExpectedAmount);
        expect(txCreation.transaction.parameters.extensions, 'extensions is wrong').to.be.undefined;
        expect(txCreation.transaction.parameters.payee, 'payee is wrong').to.be.undefined;

        expect(txCreation.transaction.parameters, 'txCreation.transaction.parameters.payer is wrong').to.have.property('payer');
        expect(txCreation.transaction.parameters.payer.type, 'txCreation.transaction.parameters.payer.type is wrong').to.equal(RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
        expect(txCreation.transaction.parameters.payer.value, 'txCreation.transaction.parameters.payer.value is wrong').to.equal(payerRaw.address);

        expect(txCreation, 'txCreation.signature is wrong').to.have.property('signature');
        expect(txCreation.signature.method, 'txCreation.signature.method is wrong').to.equal(RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA);
        expect(txCreation.signature.value, 'txCreation.signature.value').to.equal('0xd7c0d45fee9545d33862a4b6eb028769af0886f5ecd2d3e7c3362ffe7bd805e672fb99d10adc96d1b56bcd34a6a0a29d0c85b02d98da53d26eb43a6fa093b4e61b');
    });

    it('can create with the payee and the payer', () => {
        const txCreation = RequestLogic.formatCreate({
                currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                expectedAmount: arbitraryExpectedAmount,
                payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
                payer: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payerRaw.address},
            },
            {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey},
        );

        expect(txCreation, 'txCreation.transaction is wrong').to.have.property('transaction');
        expect(txCreation.transaction.action, 'action is wrong').to.equal(RequestEnum.REQUEST_LOGIC_ACTION.CREATE);
        expect(txCreation.transaction, 'txCreation.transaction.parameters is wrong').to.have.property('parameters');

        expect(txCreation.transaction.parameters.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
        expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(arbitraryExpectedAmount);
        expect(txCreation.transaction.parameters.extensions, 'extensions is wrong').to.be.undefined;

        expect(txCreation.transaction.parameters, 'txCreation.transaction.parameters.payee is wrong').to.have.property('payee');
        expect(txCreation.transaction.parameters.payee.type, 'txCreation.transaction.parameters.payee.type is wrong').to.equal(RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
        expect(txCreation.transaction.parameters.payee.value, 'txCreation.transaction.parameters.payee.value is wrong').to.equal(payeeRaw.address);

        expect(txCreation.transaction.parameters, 'txCreation.transaction.parameters.payer is wrong').to.have.property('payer');
        expect(txCreation.transaction.parameters.payer.type, 'txCreation.transaction.parameters.payer.type is wrong').to.equal(RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
        expect(txCreation.transaction.parameters.payer.value, 'txCreation.transaction.parameters.payer.value is wrong').to.equal(payerRaw.address);

        expect(txCreation, 'txCreation.signature is wrong').to.have.property('signature');
        expect(txCreation.signature.method, 'txCreation.signature.method is wrong').to.equal(RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA);
        expect(txCreation.signature.value, 'txCreation.signature.value').to.equal('0xac45cdf90d1753aafffb48864cf9920bee58a68be30afdaee7d5abf71b7fb705519056d5466fa6155f2f39db05298d3315a8887891748e15f94ec7aabb635c491b');
    });
    it('cannot create without payee and payer', () => {
        try {
            RequestLogic.formatCreate({
                    currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                    expectedAmount: arbitraryExpectedAmount,
                },
                {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey},
            );
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            expect(e.message, 'exception not right').to.be.equal('payee or PayerId must be given');
        }
    });

    it('cannot create with amount as decimal', () => {
        try {
            RequestLogic.formatCreate({
                    currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                    expectedAmount: '0.1234',
                    payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
                },
                {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey},
            );
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            expect(e.message, 'exception not right').to.be.equal('expectedAmount must be a positive integer');
        }
    });

    it('cannot create with amount not a number', () => {
        try {
            const txCreation = RequestLogic.formatCreate({
                    currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                    expectedAmount: 'NaN',
                    payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
                },
                {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey},
            );
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            expect(e.message, 'exception not right').to.be.equal('expectedAmount must be a positive integer');
        }
    });

    it('can create with extensions', () => {
        const extensions = [{id: 'extension1', value: 'whatever'}];
        const txCreation = RequestLogic.formatCreate({
                currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                expectedAmount: arbitraryExpectedAmount,
                extensions,
                payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
                payer: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payerRaw.address},
            },
            {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey},
        );

        expect(txCreation, 'txCreation.transaction is wrong').to.have.property('transaction');
        expect(txCreation.transaction.action, 'action is wrong').to.equal(RequestEnum.REQUEST_LOGIC_ACTION.CREATE);
        expect(txCreation.transaction, 'txCreation.transaction.parameters is wrong').to.have.property('parameters');

        expect(txCreation.transaction.parameters.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
        expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(arbitraryExpectedAmount);
        expect(txCreation.transaction.parameters.extensions, 'txCreation.transaction.parameters.extensions is wrong').to.equal(extensions);

        expect(txCreation.transaction.parameters, 'txCreation.transaction.parameters.payee is wrong').to.have.property('payee');
        expect(txCreation.transaction.parameters.payee.type, 'txCreation.transaction.parameters.payee.type is wrong').to.equal(RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
        expect(txCreation.transaction.parameters.payee.value, 'txCreation.transaction.parameters.payee.value is wrong').to.equal(payeeRaw.address);

        expect(txCreation.transaction.parameters, 'txCreation.transaction.parameters.payer is wrong').to.have.property('payer');
        expect(txCreation.transaction.parameters.payer.type, 'txCreation.transaction.parameters.payer.type is wrong').to.equal(RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
        expect(txCreation.transaction.parameters.payer.value, 'txCreation.transaction.parameters.payer.value is wrong').to.equal(payerRaw.address);

        expect(txCreation, 'txCreation.signature is wrong').to.have.property('signature');
        expect(txCreation.signature.method, 'txCreation.signature.method is wrong').to.equal(RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA);
        expect(txCreation.signature.value, 'txCreation.signature.value').to.equal('0xf297aedbeff9d9168c2403db6dbf74b0e6db1eb9f9fae0f42e6c9a3acbedbda5604e73f68ed48d9668988768217b56ea211ceb66f2ce05f5df32eb3fc88066011b');
    });

    it('cannot sign with ECDSA by another', () => {
        try {
            RequestLogic.formatCreate({
                    currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                    expectedAmount: arbitraryExpectedAmount,
                    payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
                    payer: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payerRaw.address},
                },
                {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: otherIdRaw.privateKey},
            );
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            expect(e.message, 'exception not right').to.be.equal('Signer must be the payee or the payer');
        }
    });

    it('cannot sign with ECDSA by payer if only payee given', () => {
        try {
            RequestLogic.formatCreate({
                    currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                    expectedAmount: arbitraryExpectedAmount,
                    payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
                },
                {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey},
            );
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            expect(e.message, 'exception not right').to.be.equal('Signer must be the payee or the payer');
        }
    });
    it('cannot sign with ECDSA by payee if only payer given', () => {
        try {
            RequestLogic.formatCreate({
                    currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                    expectedAmount: arbitraryExpectedAmount,
                    payer: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payerRaw.address},
                },
                {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey},
            );
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            expect(e.message, 'exception not right').to.be.equal('Signer must be the payee or the payer');
        }
    });

    it('can create with amount as integer, bigNumber or zero', () => {
        let txCreation = RequestLogic.formatCreate({
                currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                expectedAmount: 10000,
                payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
            },
            {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey},
        );
        expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal('10000');

        txCreation = RequestLogic.formatCreate({
                currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                expectedAmount: new bigNumber(arbitraryExpectedAmount),
                payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
            },
            {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey},
        );
        expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(arbitraryExpectedAmount);

        txCreation = RequestLogic.formatCreate({
                currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                expectedAmount: 0,
                payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
            },
            {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey},
        );
        expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal('0');
    });

    it('cannot create with amount as negative', () => {
        try {
            RequestLogic.formatCreate({
                    currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
                    expectedAmount: '-1000',
                    payee: {type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value: payeeRaw.address},
                },
                {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey},
            );
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            expect(e.message, 'exception not right').to.be.equal('expectedAmount must be a positive integer');
        }
    });

});
