// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DeFi Sweeper Registry — on-chain log of stale DeFi position cleanups
/// @notice Deployed on X Layer (chain 196) for the OKX Build X Hackathon 2026.
///         Emits a verifiable on-chain record each time the Sweeper AI agent
///         executes a one-click cleanup on behalf of a user.
/// @dev Event-only design — cheap gas, fully indexable by OKX Explorer / subgraphs.
contract SweeperRegistry {
    event PositionSwept(
        address indexed user,
        uint256 indexed timestamp,
        string sourcePlatform,
        string sourceChain,
        uint256 valueUsdScaled, // USD * 1e6
        uint256 healthScore,    // 0 (dead) – 100 (healthy)
        string destination      // e.g. "Aave V3 on X Layer"
    );

    uint256 public totalSweeps;
    uint256 public totalValueRecoveredScaled;
    mapping(address => uint256) public userSweepCount;

    /// @notice Record a completed sweep. Call this from the frontend after a
    ///         user confirms the exit tx produced by OKX /defi/transaction/exit.
    /// @param sourcePlatform      e.g. "SushiSwap V3"
    /// @param sourceChain         e.g. "ethereum" / "base"
    /// @param valueUsdScaled      USD value at sweep time, scaled by 1e6
    /// @param healthScore         AI health score at sweep time (0–100)
    /// @param destination         Target product on X Layer (free-form string)
    function logSweep(
        string calldata sourcePlatform,
        string calldata sourceChain,
        uint256 valueUsdScaled,
        uint256 healthScore,
        string calldata destination
    ) external {
        require(healthScore <= 100, "score>100");
        unchecked {
            totalSweeps += 1;
            totalValueRecoveredScaled += valueUsdScaled;
            userSweepCount[msg.sender] += 1;
        }
        emit PositionSwept(
            msg.sender,
            block.timestamp,
            sourcePlatform,
            sourceChain,
            valueUsdScaled,
            healthScore,
            destination
        );
    }

    /// @notice Batch-log multiple sweeps in a single tx (one signature, N events).
    ///         Used by "Sweep all" to clean up every stale position at once.
    function batchLogSweep(
        string[] calldata sourcePlatforms,
        string[] calldata sourceChains,
        uint256[] calldata valueUsdScaled,
        uint256[] calldata healthScores,
        string[] calldata destinations
    ) external {
        uint256 n = sourcePlatforms.length;
        require(n > 0, "empty batch");
        require(
            sourceChains.length == n &&
            valueUsdScaled.length == n &&
            healthScores.length == n &&
            destinations.length == n,
            "length mismatch"
        );

        uint256 sum = 0;
        for (uint256 i = 0; i < n; i++) {
            require(healthScores[i] <= 100, "score>100");
            emit PositionSwept(
                msg.sender,
                block.timestamp,
                sourcePlatforms[i],
                sourceChains[i],
                valueUsdScaled[i],
                healthScores[i],
                destinations[i]
            );
            sum += valueUsdScaled[i];
        }
        unchecked {
            totalSweeps += n;
            userSweepCount[msg.sender] += n;
            totalValueRecoveredScaled += sum;
        }
    }

    /// @notice Convenience view — USD with 6 decimals, as a whole-dollar integer.
    function totalValueRecoveredUsd() external view returns (uint256) {
        return totalValueRecoveredScaled / 1e6;
    }
}
