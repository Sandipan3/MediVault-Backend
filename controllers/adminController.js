import axios from "axios";
import { Interface } from "ethers";

const abi = [
  "event AccessGranted(address indexed patient, address indexed doctor, uint256 expiry)",
  "event AccessRevoked(address indexed patient, address indexed doctor)",
];

const iface = new Interface(abi);

export const getAllTransactions = async (req, res) => {
  try {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const apiKey = process.env.ETHERSCAN_API_KEY;

    const url = `https://api.etherscan.io/v2/api`;

    const response = await axios.get(url, {
      params: {
        module: "account",
        action: "txlist",
        address: contractAddress,
        startblock: 0,
        endblock: 99999999,
        sort: "desc",
        apikey: apiKey,
        chainid: process.env.SIWE_CHAIN_ID,
      },
    });

    const data = response.data;

    if (data.status !== "1") {
      return res.status(400).json({
        success: false,
        message: data.message,
        error: data.result,
      });
    }

    const formattedTx = data.result.map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasUsed: tx.gasUsed,
      timeStamp: tx.timeStamp,
      isError: tx.isError,
      functionName: tx.functionName,
      blockNumber: tx.blockNumber,
    }));

    return res.status(200).json({
      success: true,
      count: formattedTx.length,
      data: formattedTx,
    });
  } catch (error) {
    console.error("Admin Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

export const getTransactionDetails = async (req, res) => {
  try {
    const { hash } = req.params;
    const apiKey = process.env.ETHERSCAN_API_KEY;

    const url = `https://api.etherscan.io/v2/api`;

    const response = await axios.get(url, {
      params: {
        module: "proxy",
        action: "eth_getTransactionReceipt",
        txhash: hash,
        apikey: apiKey,
        chainid: process.env.SIWE_CHAIN_ID,
      },
    });

    const receipt = response.data.result;

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const logs = receipt.logs;

    const decodedLogs = logs
      .map((log) => {
        try {
          const parsed = iface.parseLog({
            topics: log.topics,
            data: log.data,
          });

          if (parsed.name === "AccessGranted") {
            const expiry = Number(parsed.args[2]);

            return {
              eventName: "AccessGranted",
              patient: parsed.args[0],
              doctor: parsed.args[1],
              expiry,
              isActive: expiry > Math.floor(Date.now() / 1000),
            };
          }

          if (parsed.name === "AccessRevoked") {
            return {
              eventName: "AccessRevoked",
              patient: parsed.args[0],
              doctor: parsed.args[1],
              isActive: false,
            };
          }

          return null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: decodedLogs,
    });
  } catch (error) {
    console.error("Tx Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction details",
    });
  }
};
