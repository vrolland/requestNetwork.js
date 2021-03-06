import { BigNumberish, ContractTransaction, providers, Signer } from 'ethers';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import { ethereumProxyArtifact } from '@requestnetwork/smart-contracts';
import { EthereumProxy__factory } from '@requestnetwork/smart-contracts/types';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';

/**
 * Processes a transaction to pay an ETH Request with the proxy contract.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payEthProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodePayEthProxyRequest(request, signerOrProvider);
  const proxyAddress = ethereumProxyArtifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);
  const amountToPay = getAmountToPay(request, amount);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: proxyAddress,
    value: amountToPay,
    ...overrides,
  });
  return tx;
}

/**
 * Encodes the call to pay a request through the ETH proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function encodePayEthProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA);
  const signer = getSigner(signerOrProvider);

  const proxyAddress = ethereumProxyArtifact.getAddress(request.currencyInfo.network!);

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  const proxyContract = EthereumProxy__factory.connect(proxyAddress, signer);
  return proxyContract.interface.encodeFunctionData('transferWithReference', [
    paymentAddress,
    `0x${paymentReference}`,
  ]);
}
