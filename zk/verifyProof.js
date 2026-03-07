import * as snarkjs from "snarkjs";
import fs from "fs";

const vKey = JSON.parse(fs.readFileSync("./circuits/verification_key.json"));

export const verifyProof = async (proof, publicSignals) => {
  const result = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  return result;
};
