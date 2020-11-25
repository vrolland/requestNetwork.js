// SPDX-License-Identifier: MIT
pragma solidity >=0.4.25 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";

interface ERC20fraction {
  function decimals() external view returns (uint8);
}

interface AggregatorFraction {
  function decimals() external view returns (uint8);
  function latestAnswer() external view returns (int256);
  function latestTimestamp() external view returns (uint256);
}


/**
 * @title ChainlinkConversionPath
 *
 * @notice ChainlinkConversionPath is a contract allowing to compute conversion rate from a Chainlink aggretators
 */
contract ChainlinkConversionPath is WhitelistAdminRole {
  using SafeMath for uint256;

  uint constant DECIMALS = 1e18;

  // Mapping of Chainlink aggregators (input currency => output currency => contract address)
  // input & output currencies are the addresses of the ERC20 contracts OR the sha3("currency code")
  mapping(address => mapping(address => address)) public allAggregators;

  // rate must have been updated before the last... 10min
  uint256 public maxTimestampDeltaAcceptable = 600;

  // declare a new aggregator
  event AggregatorUpdated(address _input, address _output, address _aggregator);

  /**
    * @notice Update an aggregator
    * @param _input address representing the input currency
    * @param _output address representing the output currency
    * @param _aggregator address of the aggregator contract
  */
  function updateAggregator(address _input, address _output, address _aggregator)
    external
    onlyWhitelistAdmin
  {
    allAggregators[_input][_output] = _aggregator;
    emit AggregatorUpdated(_input, _output, _aggregator);
  }

  /**
    * @notice Update a list of aggregators
    * @param _inputs list of addresses representing the input currencies
    * @param _outputs list of addresses representing the output currencies
    * @param _aggregators list of addresses of the aggregator contracts
  */
  function updateAggregatorsList(address[] calldata _inputs, address[] calldata _outputs, address[] calldata _aggregators)
    external
    onlyWhitelistAdmin
  {
    require(_inputs.length == _outputs.length, "arrays must have the same length");
    require(_inputs.length == _aggregators.length, "arrays must have the same length");

    // For every conversions of the path
    for (uint i; i < _inputs.length; i++) {
      allAggregators[_inputs[i]][_outputs[i]] = _aggregators[i];
      emit AggregatorUpdated(_inputs[i], _outputs[i], _aggregators[i]);
    }
  }

  /**
  * @notice Computes the conversion from an amount through a list of conversion
  * @param _amountIn Amount to convert
  * @param _path List of addresses representing the currencies for the conversions
  * @return result the result after all the conversion
  * @return oldestRateTimestamp he oldest timestamp of the path
  */
  function getConversion(
    uint256 _amountIn,
    address[] calldata _path
  )
    external
    view
    returns (uint256 result, uint256 oldestRateTimestamp)
  {
    (uint256 rate, uint256 timestamp, uint256 decimals) = getRate(_path);

    // initialize the result
    result = _amountIn.mul(rate).div(decimals);

    oldestRateTimestamp = timestamp;
  }

  /**
  * @notice Computes the rate from a list of conversion
  * @param _path List of addresses representing the currencies for the conversions
  * @return result the rate
  * @return oldestRateTimestamp he oldest timestamp of the path
  * @return decimals of the conversion rate
  */
  function getRate(
    address[] memory _path
  )
    public
    view
    returns (uint256 result, uint256 oldestRateTimestamp, uint256 decimals)
  {
    // initialize the result with 1e18 decimals (for more precision)
    result = DECIMALS;
    decimals = DECIMALS;
    oldestRateTimestamp = block.timestamp;

    // For every conversions of the path
    for (uint i; i < _path.length - 1; i++) {
      (AggregatorFraction aggregator, bool reverseAggregator, uint256 decimalsInput, uint256 decimalsOutput) = getAggregatorAndDecimals(_path[i], _path[i + 1]);

      // store the latest timestamp of the path
      uint256 currentTimestamp = aggregator.latestTimestamp();
      if (currentTimestamp < oldestRateTimestamp) {
        oldestRateTimestamp = currentTimestamp;
      }

      // get the rate
      uint256 rate = uint256(aggregator.latestAnswer());
      // get the number of decimal of the rate
      uint256 decimalsAggregator = uint256(aggregator.decimals());

      // mul with the difference of decimals before the rate computation (for more precision)
      if (decimalsAggregator > decimalsInput) {
        result = result.mul(10**(decimalsAggregator-decimalsInput));
      }
      if (decimalsAggregator < decimalsOutput) {
        result = result.mul(10**(decimalsOutput-decimalsAggregator));
      }

      // Apply the rate (if path uses an aggregator in the reverse way, div instead of mul)
      if (reverseAggregator) {
        result = result.mul(10**decimalsAggregator).div(rate);
      } else {
        result = result.mul(rate).div(10**decimalsAggregator);
      }

      // div with the difference of decimals AFTER the rate computation (for more precision)
      if (decimalsAggregator < decimalsInput) {
        result = result.div(10**(decimalsInput-decimalsAggregator));
      }
      if (decimalsAggregator > decimalsOutput) {
        result = result.div(10**(decimalsAggregator-decimalsOutput));
      }
    }
  }

  /**
  * @notice Gets aggregators and decimals of two currencies
  * @param _input input Address
  * @param _output output Address
  * @return aggregator to get the rate between the two currencies
  * @return reverseAggregator true if the aggregator returned give the rate from _output to _input
  * @return decimalsInput decimals of _input
  * @return decimalsOutput decimals of _output
  */
  function getAggregatorAndDecimals(address _input, address _output)
    private
    view
    returns (AggregatorFraction aggregator, bool reverseAggregator, uint256 decimalsInput, uint256 decimalsOutput)
  {
    // Try to get the right aggregator for the conversion
    aggregator = AggregatorFraction(allAggregators[_input][_output]);
    reverseAggregator = false;

    // if no aggregator found we try to find an aggregator in the reverse way
    if (address(aggregator) == address(0x00)) {
      aggregator = AggregatorFraction(allAggregators[_output][_input]);
      reverseAggregator = true;
    }

    require(address(aggregator) != address(0x00), "No aggregator found");

    // get the decimals for the two currencies
    decimalsInput = getDecimals(_input);
    decimalsOutput = getDecimals(_output);
  }

  /**
  * @notice Gets decimals from an address currency
  * @param _addr address to check
  * @return number of decimals
  */
  function getDecimals(address _addr)
    private
    view
    returns (uint256 decimals)
  {
    // by default we assume it is FIAT so 8 decimals
    decimals = 8;
    // if address is 0, then it's ETH
    if (_addr == address(0x0)) {
      decimals = 18;
    } else if (isContract(_addr)) {
      // otherwise, we get the decimals from the erc20 directly
      decimals = ERC20fraction(_addr).decimals();
    }
  }

  /**
  * @notice Checks if an address is a contract
  * @param _addr Address to check
  * @return true if the address host a contract, false otherwise
  */
  function isContract(address _addr)
    private
    view
    returns (bool)
  {
    uint32 size;
    // solium-disable security/no-inline-assembly
    assembly {
      size := extcodesize(_addr)
    }
    return (size > 0);
  }
}
