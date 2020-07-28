import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import getBalanceErrorObject from '../balance-error';
import PaymentReferenceCalculator from '../payment-reference-calculator';
import ProxyInfoRetriever from './proxy-info-retriever';

const bigNumber: any = require('bn.js');

// tslint:disable:max-classes-per-file
/** Exception when network not supported */
class NetworkNotSupported extends Error {}
/** Exception when version not supported */
class VersionNotSupported extends Error {}

interface IProxyContractByVersionByNetwork {
  [version: string]: {
    [network: string]: { address: string; creationBlockNumber: number };
  };
}

const FEE_PROXY_CONTRACT_ADDRESS_BY_VERSION_BY_NETWORK: IProxyContractByVersionByNetwork = {
  ['0.1.0']: {
    private: {
      address: erc20FeeProxyArtifact.getAddress('private'),
      creationBlockNumber: erc20FeeProxyArtifact.getCreationBlockNumber('private'),
    },
  },
};

/**
 * Handle payment networks with ERC20 fee proxy contract extension
 */
export default class PaymentNetworkERC20FeeProxyContract implements PaymentTypes.IPaymentNetwork {
  private extension: ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased;
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this.extension = advancedLogic.extensions.proxyContractFeeErc20;
  }

  /**
   * Creates the extensions data for the creation of this extension.
   * Will set a salt if none is already given
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnFeeReferenceBased.ICreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // If no salt is given, generate one
    const salt =
      paymentNetworkCreationParameters.salt || (await Utils.crypto.generate8randomBytes());

    return this.extension.createCreationAction({
      feeAddress: paymentNetworkCreationParameters.feeAddress,
      feeAmount: paymentNetworkCreationParameters.feeAmount,
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      salt,
    });
  }

  /**
   * Creates the extensions data to add payment address
   *
   * @param parameters to add payment information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddPaymentInformation(
    parameters: ExtensionTypes.PnReferenceBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddPaymentAddressAction({
      paymentAddress: parameters.paymentAddress,
    });
  }

  /**
   * Creates the extensions data to add refund address
   *
   * @param Parameters to add refund information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddRefundInformation(
    parameters: ExtensionTypes.PnReferenceBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddRefundAddressAction({
      refundAddress: parameters.refundAddress,
    });
  }

  /**
   * Creates the extensions data to add fee address and amount
   *
   * @param Parameters to add refund information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddFeeInformation(
    parameters: ExtensionTypes.PnFeeReferenceBased.IAddFeeParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddFeeAction({
      feeAddress: parameters.feeAddress,
      feeAmount: parameters.feeAmount,
    });
  }

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request the request to check
   * @param paymentNetworkId payment network id
   * @param tokenContractAddress the address of the token contract
   * @returns the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IBalanceWithEvents> {
    const paymentNetworkId = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT;
    const paymentNetwork = request.extensions[paymentNetworkId];

    if (!paymentNetwork) {
      return getBalanceErrorObject(
        `The request does not have the extension : ${paymentNetworkId}`,
        PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
      );
    }
    try {
      const paymentAddress = paymentNetwork.values.paymentAddress;
      const refundAddress = paymentNetwork.values.refundAddress;
      const salt = paymentNetwork.values.salt;

      let payments: PaymentTypes.IBalanceWithEvents = { balance: '0', events: [] };
      if (paymentAddress) {
        payments = await this.extractBalanceAndEvents(
          request,
          salt,
          paymentAddress,
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          paymentNetwork.version,
        );
      }

      let refunds: PaymentTypes.IBalanceWithEvents = { balance: '0', events: [] };
      if (refundAddress) {
        refunds = await this.extractBalanceAndEvents(
          request,
          salt,
          refundAddress,
          PaymentTypes.EVENTS_NAMES.REFUND,
          paymentNetwork.version,
        );
      }

      // const fees = [...payments.events, ...refunds.events].reduce(
      //   (
      //     fee: { [address: string]: PaymentTypes.IBalanceWithEvents },
      //     event: PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20FeePaymentEventParameters>,
      //   ): { [address: string]: PaymentTypes.IBalanceWithEvents } => {
      //     if (!event.parameters || !event.parameters.feeAddress || !event.parameters.feeAmount) {
      //       return fee;
      //     }
      //     if (!fee[event.parameters.feeAddress]) {
      //       fee[event.parameters.feeAddress] = {
      //         balance: event.parameters.feeAmount,
      //         events: [event],
      //       };
      //     } else {
      //       fee[event.parameters.feeAddress].balance += event.parameters.feeAmount;
      //       fee[event.parameters.feeAddress].events.push(event);
      //     }
      //     return fee;
      //   },
      //   {},
      // );

      const balance: string = new bigNumber(payments.balance || 0)
        .sub(new bigNumber(refunds.balance || 0))
        .toString();

      const events: PaymentTypes.ERC20PaymentNetworkEvent[] = [
        ...payments.events,
        ...refunds.events,
      ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      return {
        balance,
        events,
      };
    } catch (error) {
      let code: PaymentTypes.BALANCE_ERROR_CODE | undefined;
      if (error instanceof NetworkNotSupported) {
        code = PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED;
      }
      if (error instanceof VersionNotSupported) {
        code = PaymentTypes.BALANCE_ERROR_CODE.VERSION_NOT_SUPPORTED;
      }
      return getBalanceErrorObject(error.message, code);
    }
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param tokenContractAddress the address of the token contract
   * @returns The balance and events
   */
  private async extractBalanceAndEvents(
    request: RequestLogicTypes.IRequest,
    salt: string,
    toAddress: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    paymentNetworkVersion: string,
  ): Promise<PaymentTypes.IBalanceWithEvents> {
    const network = request.currency.network;

    if (!network) {
      throw new NetworkNotSupported(`Payment network not supported by ERC20 payment detection`);
    }

    if (!FEE_PROXY_CONTRACT_ADDRESS_BY_VERSION_BY_NETWORK[paymentNetworkVersion]) {
      throw new VersionNotSupported(
        `Payment network version not supported: ${paymentNetworkVersion}`,
      );
    }

    const proxyContractAddress: string | undefined =
      FEE_PROXY_CONTRACT_ADDRESS_BY_VERSION_BY_NETWORK[paymentNetworkVersion][network].address;
    const proxyCreationBlockNumber: number =
      FEE_PROXY_CONTRACT_ADDRESS_BY_VERSION_BY_NETWORK[paymentNetworkVersion][network]
        .creationBlockNumber;

    if (!proxyContractAddress) {
      throw new NetworkNotSupported(
        `Network not supported for this payment network: ${request.currency.network}`,
      );
    }

    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      toAddress,
    );

    const infoRetriever = new ProxyInfoRetriever(
      paymentReference,
      proxyContractAddress,
      proxyCreationBlockNumber,
      request.currency.value,
      toAddress,
      eventName,
      network,
    );

    const events = await infoRetriever.getTransferEvents();

    const balance = events
      .reduce((acc, event) => acc.add(new bigNumber(event.amount)), new bigNumber(0))
      .toString();

    return {
      balance,
      events,
    };
  }
}
