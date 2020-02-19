/**
 * # Creating a Request using mock storage
 *
 * This is an example of the simplest way to create a test Request, using a fake/mock storage.
 * The request will be stored in memory and cleared as soon as the script is finished running.
 */

/**
 * ## Imports
 *
 * First we import the 2 packages we will need to create the request:
 */
// The signature provider allow us to sign the request
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
// RequestNetwork is the interface we will use to interact with the Request network
import * as RequestNetwork from '@requestnetwork/request-client.js';

/**
 * ## Identity
 *
 * To create a request we need to declare the identities of the parties involved.
 * Identities are the unique identifier of a request user. They are not payment addresses, only unique addresses that identify a person/entity.
 */

// Here we declare the payee identity,  with the payee identity ethereum address
const payeeIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};

// Here we declare the (optional, but recommended) payer identity address.
const payerIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
};

/**
 * ## Signature Provider
 *
 * The ethereum private key signature provider allow a user to pass in their private ethereum key to sign a request.
 * The signature is a proof of who created the request and of it's integrity (that no data changed after it was signed).
 * This process is similar to the signature of an Ethereum transaction.
 */

// The signature info requires the request creator private key.
// Please be careful with how you store and handle your private key, since it's a very sensitive piece of data.
const payeeSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);

/**
 * ## Request Information
 *
 * In the next section of code we declare the request information.
 */

// The main request info, with the currency, amount (in the smallest denominator), payee identity and payer identity
const requestInfo: RequestNetwork.Types.IRequestInfo = {
  currency: 'REQ',
  expectedAmount: '1000000000000000000', // 1 REQ
  payee: payeeIdentity,
  payer: payerIdentity,
};

const createParams = {
  requestInfo,
  signer: payeeIdentity,
};

/**
 * ## Request Creation
 *
 * Time for action!
 */

// We initialize the RequestNetwork class with the signature provider and inform we will be using the mock storage.
const requestNetwork = new RequestNetwork.RequestNetwork({
  signatureProvider,
  useMockStorage: true,
});

// Finally create the request and print it's id
const requestPromise = requestNetwork.createRequest(createParams);

requestPromise.then(request => {
  console.log('Request created:');
  console.log(request.requestId);
});
