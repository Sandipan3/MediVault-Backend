import PatientDocument from "../models/PatientDocument.js";
import { buildPoseidon } from "circomlibjs";

const LEVELS = 20;

let poseidon;

(async () => {
  poseidon = await buildPoseidon();
})();

function hash(left, right) {
  const result = poseidon([BigInt(left), BigInt(right)]);
  return poseidon.F.toString(result);
}

export const getMerklePath = async (req, res) => {
  try {
    if (!poseidon) {
      return res
        .status(500)
        .json({ status: "error", message: "Poseidon not initialized yet" });
    }

    const { documentId } = req.params;

    const docs = await PatientDocument.find().sort({ createdAt: 1 });

    if (!docs.length) {
      return res
        .status(404)
        .json({ status: "error", message: "No documents found" });
    }

    const leaves = docs.map((doc) => doc.commitment.toString());

    const index = docs.findIndex((doc) => doc._id.toString() === documentId);

    if (index === -1) {
      return res
        .status(404)
        .json({ status: "error", message: "Document not found in tree" });
    }

    // build tree
    let tree = [];
    tree.push(leaves);

    let currentLevel = leaves;

    for (let level = 0; level < LEVELS; level++) {
      const nextLevel = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] ?? left;

        nextLevel.push(hash(left, right));
      }

      tree.push(nextLevel);
      currentLevel = nextLevel;
    }

    const root = tree[LEVELS][0];

    // generate merkle proof
    let pathElements = [];
    let pathIndices = [];

    let leafIndex = index;

    for (let level = 0; level < LEVELS; level++) {
      const levelNodes = tree[level];

      const isRight = leafIndex % 2;

      const pairIndex = isRight ? leafIndex - 1 : leafIndex + 1;

      const sibling =
        pairIndex < levelNodes.length
          ? levelNodes[pairIndex]
          : levelNodes[leafIndex];

      pathElements.push(sibling.toString());
      pathIndices.push(isRight);

      leafIndex = Math.floor(leafIndex / 2);
    }

    res.status(200).json({
      status: "success",
      root: root.toString(),
      pathElements,
      pathIndices,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      status: "error",
      message: "Error generating Merkle proof",
    });
  }
};
