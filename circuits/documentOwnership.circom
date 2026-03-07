pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template DocumentOwnership(levels) {

    signal input root;
    signal input cidHash;

    signal input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal leaf;
    signal hashes[levels + 1];

    component leafHash = Poseidon(2);

    leafHash.inputs[0] <== secret;
    leafHash.inputs[1] <== cidHash;

    leaf <== leafHash.out;

    hashes[0] <== leaf;

    component hashers[levels];

    signal left[levels];
    signal right[levels];
    signal diff[levels];

    for (var i = 0; i < levels; i++) {

        hashers[i] = Poseidon(2);

        diff[i] <== pathElements[i] - hashes[i];

        left[i]  <== hashes[i] + pathIndices[i] * diff[i];
        right[i] <== pathElements[i] - pathIndices[i] * diff[i];

        hashers[i].inputs[0] <== left[i];
        hashers[i].inputs[1] <== right[i];

        hashes[i + 1] <== hashers[i].out;
    }

    root === hashes[levels];
}

component main {public [root, cidHash]} = DocumentOwnership(20);