import { Contract, ContractInterface, providers, Signer } from 'ethers';

/**
 * Contract information specific to a network
 */
export type ArtifactNetworkInfo = {
  /** Contract's address */
  address: string;
  /** Block number at which the contract was created */
  creationBlockNumber: number;
};

/** Deployment information and ABI per network */
export type ArtifactDeploymentInfo<TNetwork extends string = string> = {
  abi: ContractInterface;
  deployment: Record<TNetwork, ArtifactNetworkInfo>;
};

/** Deployment information and ABI per version and network */
export type ArtifactInfo<
  TVersion extends string = string,
  TNetwork extends string = string
> = Record<TVersion, ArtifactDeploymentInfo<TNetwork>>;

/**
 * Provides information on a deployed smart-contract,
 * and utilities to connect to it
 **/
export class ContractArtifact<
  TContract extends Contract,
  TNetwork extends string,
  TVersions extends string
> {
  constructor(
    // this parameter is only used to infer the Contract type
    // because ContractArtifact<MyContract> isn't possible
    // TS requires to all or nothing
    // see https://github.com/Microsoft/TypeScript/issues/10571
    _: new (
      addressOrName: string,
      contractInterface: ContractInterface,
      signerOrProvider?: Signer | providers.Provider,
    ) => TContract,
    private info: ArtifactInfo<TVersions, TNetwork>,
    private lastVersion: TVersions,
  ) {}

  /**
   * Returns an ethers contract instance for the given `networkName`
   */
  connect(
    networkName: TNetwork,
    signerOrProvider?: Signer | providers.Provider,
    version?: TVersions,
  ): TContract {
    return new Contract(
      this.getAddress(networkName, version),
      this.getContractAbi(version),
      signerOrProvider,
    ) as TContract;
  }
  /**
   * Retrieve the abi from the artifact of the used version
   * @returns the abi of the artifact as a json object
   */
  getContractAbi(version = this.lastVersion): ContractInterface {
    return this.info[version].abi;
  }

  /**
   * Retrieve the address from the artifact of the used version
   * deployed into the specified network
   * @param networkName the name of the network where the contract is deployed
   * @returns the address of the deployed contract
   */
  getAddress(networkName: TNetwork, version = this.lastVersion): string {
    return this.getDeploymentInformation(networkName, version).address;
  }

  /**
   * Retrieve the block creation number from the artifact of the used version
   * deployed into the specified network
   * @param networkName the name of the network where the contract is deployed
   * @returns the number of the block where the contract was deployed
   */
  getCreationBlockNumber(networkName: TNetwork, version = this.lastVersion): number {
    return this.getDeploymentInformation(networkName, version).creationBlockNumber;
  }

  /**
   * Retrieve the deployment information from the artifact of the used version
   * deployed into the specified network
   * @param networkName the name of the network where the contract is deployed
   * @returns the deployment information of the contract as a json object containing address and the number of the creation block
   */
  getDeploymentInformation(
    networkName: TNetwork,
    version = this.lastVersion,
  ): { address: string; creationBlockNumber: number } {
    const info = this.info[version].deployment[networkName];
    // Check the artifact has been deployed into the specified network
    if (!info) {
      throw Error(`No deployment for network: ${networkName}`);
    }
    return info;
  }
}
