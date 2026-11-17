# zkverifyjs Instructions

The `zkverifyjs` package is a TypeScript library designed to facilitate sending proofs to zkVerify for verification, listening for transaction events, and waiting for transaction finalization. The package is built with an intuitive API that allows developers to handle real-time transaction events and await final results.

## Supported Proof Systems

The following zero-knowledge proof systems are supported:

Proof configuration enums and interfaces are exported from `zkverifyjs`, including `Risc0Version`, `UltrahonkVersion`, `UltrahonkVariant`, `TeeVariant`, `UltrahonkConfig`, and `TeeConfig`.

### FFlonk
```typescript
session.verify().fflonk().execute({...})
```

### Groth16
Supports multiple library and curve combinations:

**Supported Elliptic Curves:**
- BN128
- BN254
- BLS12-381

**Supported Libraries:**
- snarkjs
- arkworks
- gnark

```typescript
session.verify().groth16({
  library: Library.snarkjs,    // or Library.arkworks, Library.gnark
  curve: CurveType.bls12381    // or CurveType.bn128, CurveType.bn254
}).execute({...})
```

### Plonky2
Must be an uncompressed proof. Requires hash function specification.

```typescript
session.verify().plonky2({
  hashFunction: Plonky2HashFunction.Poseidon
}).execute({...})
```

### Risc0
Supports versions: `V2_1`, `V2_2`, `V2_3`, `V3_0`

**Runtime v2.1.0+**: `V2_1` is no longer verified on-chain. zkverifyjs rejects `V2_1` proof submissions on runtime v2.1.0 or later; use `V2_2` or later.

```typescript
session.verify().risc0({
  version: Risc0Version.V3_0
}).execute({...})
```

### Ultraplonk
Requires number of public inputs.

```typescript
session.verify().ultraplonk({
  numberOfPublicInputs: 1
}).execute({...})
```

### SP1
```typescript
session.verify().sp1().execute({...})
```

### EZKL
```typescript
session.verify().ezkl().execute({...})
```

### UltraHonk
Supports versions: `V0_84`, `V3_0`, `Legacy`, `V5_0` (runtime v2.1.0+)
Supports variants: `Plain`, `ZK`

**Note for zkverifyjs v2.4.0+ and runtime v1.6.0+**: The `version` and `variant` options are required. If `version` is omitted, zkverifyjs defaults to:
- `V0_84` on runtime v1.6.0
- `Legacy` on runtime v1.6.1+

The `Legacy` default preserves pre-versioning Ultrahonk statement hash compatibility.

**Runtime v2.1.0+**: ZK proofs are only accepted for `V5_0` (Barretenberg v5.0.0 or later). The `ZK` variant of `V0_84`, `V3_0` and `Legacy` is rejected by the verifier, and zkverifyjs rejects those combinations before submission. Because a missing `version` defaults to `Legacy`, ZK proofs must pass `version: UltrahonkVersion.V5_0` explicitly. The `Plain` variant of every version is still supported. Public inputs must be 32-byte canonical BN254 field elements (below the scalar field modulus).

`getVkHash` for `V5_0` verification keys requires an RPC node running a node binary that includes the `V5_0` vk_hash type. Nodes that only enacted the runtime upgrade return an error for `V5_0` VKs.

```typescript
session.verify().ultrahonk({
  version: UltrahonkVersion.V5_0,
  variant: UltrahonkVariant.ZK
}).execute({...})
```

### TEE
Supports variants: `Intel`

**Note for zkverifyjs v2.4.0+ and runtime v1.6.0+**: The `variant` option is required. If omitted, zkverifyjs defaults to `Intel` for backwards compatibility and logs a warning.

```typescript
session.verify().tee({
  variant: TeeVariant.Intel
}).execute({...})
```

## Runtime Versions and Network Compatibility

The zkVerify ecosystem consists of multiple networks that may run different runtime versions:

- **zkVerify Mainnet**: Production network
- **Volta Testnet**: Testing network with latest features
- **Custom Networks**: Can run any runtime version

### Version-Dependent Features

Some features are only available on specific runtime versions. The library automatically detects the runtime version when establishing a connection and may:

1. **Require different parameters** for existing functions on certain runtime versions
2. **Block access to features** not available on older runtimes
3. **Provide clear error messages** when version requirements aren't met

The session also follows runtime upgrades enacted while it is open: version-dependent defaults, checks and RPC types switch to the new runtime without reconnecting.

# Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Creating a Session](#creating-a-session)
    - [Verifying a Proof](#verifying-a-proof)
    - [Verifying a batch of Proofs](#verifying-a-batch-of-proofs)
    - [Registering a Verification Key & Submitting a proof with the Statement Hash](#registering-a-verification-key--submitting-a-proof-with-the-statement-hash)
    - [Listening to Events](#listening-to-events)
    - [Awaiting the Final Transaction Result](#awaiting-the-final-transaction-result)
    - [Proof Aggregation](#domain-specific-proof-aggregation)
    - [Optimistic Proof Verification](#optimistic-proof-verification)
    - [Batch Optimistic Proof Verification](#batch-optimistic-proof-verification)
    - [Domain Management](#domain-management-aggregate-pallet)
    - [Example Usage](#example-usage)
- [API Reference](#api-reference)
    - [zkVerifySession.start](#zkverifysessionstart)
    - [zkVerifySession.close](#zkverifysessionclose)
    - [zkVerifySession.verify](#zkverifysessionverify)
    - [zkVerifySession.batchVerify](#zkverifysessionbatchverify)
    - [zkVerifySession.optimisticVerify](#zkverifysessionoptimisticverify)
    - [zkVerifySession.batchOptimisticVerify](#zkverifysessionbatchoptimisticverify)
    - [zkVerifySession.registerVerificationKey](#zkverifysessionregisterverificationkey)
    - [zkVerifySession.getAggregateStatementPath](#zkverifysessiongetaggregatestatementpath)
    - [zkVerifySession.getVkHash](#zkverifysessiongetvkhash)
    - [zkVerifySession.format](#zkverifysessionformat)
    - [zkVerifySession.formatVk](#zkverifysessionformatvk)
    - [zkVerifySession.createSubmitProofExtrinsic](#zkverifysessioncreatesubmitproofextrinsic)
    - [zkVerifySession.createExtrinsicHex](#zkverifysessioncreateextrinsichex)
    - [zkVerifySession.createExtrinsicFromHex](#zkverifysessioncreateextrinsicfromhex)
    - [zkVerifySession.estimateCost](#zkverifysessionestimatecost)
    - [zkVerifySession.getAccountInfo](#zkverifysessiongetaccountinfo)
    - [zkVerifySession.getAccount](#zkverifysessiongetaccount)
    - [zkVerifySession.addAccount](#zkverifysessionaddaccount)
    - [zkVerifySession.addAccounts](#zkverifysessionaddaccounts)
    - [zkVerifySession.addDerivedAccounts](#zkverifysessionaddderivedaccounts)
    - [zkVerifySession.removeAccount](#zkverifysessionremoveaccount)
    - [zkVerifySession.subscribe](#zkverifysessionsubscribe)
    - [zkVerifySession.waitForAggregationReceipt](#zkverifysessionwaitforaggregationreceipt)
    - [zkVerifySession.unsubscribe](#zkverifysessionunsubscribe)
    - [zkVerifySession.aggregate](#zkverifysessionaggregate)
    - [zkVerifySession.registerDomain](#zkverifysessionregisterdomain)
    - [zkVerifySession.holdDomain](#zkverifysessionholddomain)
    - [zkVerifySession.unregisterDomain](#zkverifysessionunregisterdomain)
    - [zkVerifySession.addDomainSubmitters](#zkverifysessionadddomainsubmitters) (v1.3.0+)
    - [zkVerifySession.removeDomainSubmitters](#zkverifysessionremovedomainsubmitters) (v1.3.0+)
    - [zkVerifySession.api](#zkverifysessionapi)
    - [zkVerifySession.provider](#zkverifysessionprovider)
    - [zkVerifySession.connection](#zkverifysessionconnection)
    - [zkVerifySession.readOnly](#zkverifysessionreadonly)
    - [Runtime version helpers](#runtime-version-helpers)
  
- [Testing](#testing)

# Installation

To install the package, use npm or yarn:

```bash
npm install zkverifyjs
```

# Usage

## Creating a Session

Before sending a proof, you need to start a session. A session establishes a connection to the zkVerify network and optionally sets up an account using a seed phrase (required for sending transactions).

1. Read-Only Session with Supported Network:
```typescript
const session = await zkVerifySession.start()
        .zkVerify(); // Preconfigured network selection
// No full account session as .withAccount() or .withAccounts() has not been used.
```
2. Read-Only Session with Custom Network Configuration:
```typescript
const session = await zkVerifySession.start()
        .Custom({
          websocket: "wss://testnet-rpc.zkverify.io",
          rpc: "https://testnet-rpc.zkverify.io",
          network: "Volta", // Optional
        }); // Custom network
// No full account session as .withAccount() or withAccounts() has not been used.
```
3. Full Backend Session (send transactions) with Supported Network:
```typescript
// Use a single account
const session = await zkVerifySession.start()
        .zkVerify() // Preconfigured network selection
        .withAccount("my seed phrase"); // Full session with a single active account

// Use many accounts
const multiAccountSession = await zkVerifySession.start()
        .zkVerify() // Preconfigured network selection
        .withAccounts(["my seed phrase 1", "my seed phrase 2", "my seed phrase 3"]); // Full session with multiple active accounts
```
4. Full Backend Session (send transactions) with Custom WebSocket:
```typescript
const session = await zkVerifySession.start()
        .Custom({
          websocket: "wss://my-custom-node",
          rpc: "https://my-custom-node",
          network: "Volta", // Optional: "Volta" for a testnet node, otherwise mainnet address encoding is used
        })
        .withAccount("my seed phrase"); // Full session with active account
```
5. Full Frontend Browser Session (send transactions)  with Supported Network:
```typescript
const session = await zkVerifySession.start()
        .zkVerify()
        .withWallet({
          source: selectedWallet,
          accountAddress: selectedAccount,
          appName: "My dApp", // Shown by the wallet extension in its access prompt; defaults to "zkVerify"
        }); // Uses browser session context "window"
```
6. Full Frontend Browser Session (send transactions) with Custom WebSocket:
```typescript
const session = await zkVerifySession.start()
        .Custom({
          websocket: "wss://testnet-rpc.zkverify.io",
          rpc: "https://testnet-rpc.zkverify.io"
        }) // Custom network
        .withWallet({
          source: selectedWallet,
          accountAddress: selectedAccount,
        }); // Uses browser session context "window"
```

Not specifying `withAccount()`, `withAccounts()` or `withWallet()` will start a read-only session, transaction methods cannot be used, and only calls to read data are allowed:

```typescript
import { zkVerifySession } from 'zkverifyjs';

const readOnlySession = await zkVerifySession.start().zkVerify();
```

## Verifying a Proof

The zkVerifySession.verify method allows you to configure and execute a verification process using a fluent syntax. This approach offers a more readable and flexible way to set up your verification options before executing the proof verification.

1. Backend / server side after establishing a session with `withAccount()`

```typescript
const { events, transactionResult } = await session
  .verify() // Optionally provide account address to verify("myaddress") if connected with multple accounts
  .ultraplonk({
    numberOfPublicInputs: 1
  }) // Select the proof type (e.g., ultraplonk)
  .nonce(1) // Set the nonce (optional)
  .withRegisteredVk() // Indicate that the verification key is already registered (optional)
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      //publicSignals: publicSignals, // Not required for Ultraplonk
    },
    domainId: 42, // Optional domain ID for proof aggregation
  }); // Execute the verification with the provided proof data
```

2. Frontend after establishing a session with `withWallet()`

```typescript
import { CurveType, Library, ZkVerifyEvents } from 'zkverifyjs';

const { events, transactionResult } = await session
  .verify()
  .groth16({
    library: Library.snarkjs,
    curve: CurveType.bn128
  })
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 1, // Optional domain ID for proof categorization
  });

events.on(ZkVerifyEvents.ErrorEvent, (eventData) => {
  console.error(JSON.stringify(eventData));
});

let transactionInfo = null;
try {
  transactionInfo = await transactionResult;
} catch (error) {
  throw new Error(`Transaction failed: ${error.message}`);
}
```

## Verifying a Batch of Proofs

You can submit a batch of proofs as an array of proof objects.

- All proofs must be the same `ProofType` and proof config (e.g. groth16 created with snarkjs using bn254 curve).

```typescript
const { events, transactionResult } = await session
    .batchVerify(optionalAccountAddress) // You can pass account address here if multiple connected to your session.
    .groth16({
        library: Library.snarkjs,
        curve: CurveType.bn254,
    })
    .withRegisteredVk() // optional
    .nonce(1) // optional
    .execute([
        {
            proofData: {
                proof: proof,
                publicSignals: publicSignals,
                vk: vk,
            },
            domainId: 0,
        },
        {
            proofData: {
                proof: proof,
                publicSignals: publicSignals,
                vk: vk,
            },
            domainId: 0,
        },
    ]);
```

If any proof fails, all will fail.

## Registering a Verification Key & Submitting a proof with the Statement Hash

Register your Verification Key on chain and use it in future proof submissions by specifying the `withRegisteredVk()` option.

```typescript
const { events, transactionResult } = await session
  .registerVerificationKey()
  .ultraplonk({
    numberOfPublicInputs: 1
  })
  .execute(vk);
const vkTransactionInfo: VKRegistrationTransactionInfo =
  await transactionResult;

const { events: verifyEvents, transactionResult: verifyTransactionResult } =
  await session
    .verify()
    .ultraplonk({
      numberOfPublicInputs: 1
    })
    .withRegisteredVk() // Option needs to be specified as we're using the registered statement hash.
    .execute({
      proofData: {
        vk: vkTransactionInfo.statementHash!,
        proof: proof,
        //publicSignals: publicSignals, // Not required for ultraplonk
      },
      domainId: 42,
    });

const verifyTransactionInfo: VerifyTransactionInfo =
  await verifyTransactionResult;
```

## Listening to Events

You can listen for transaction events using the events emitter. Common events include:

- `includedInBlock`: Triggered when the transaction is included in a block.
- `finalized`: Triggered when the transaction is finalized.
- `error`: Triggered if an error occurs during the transaction process.

```typescript
import { Risc0Version } from 'zkverifyjs';

const {events, transactionResult} = await session
        .verify()
        .risc0({
          version: Risc0Version.V3_0
        })
        .execute({
          proofData: {
            vk: vk,
            proof: proof,
            publicSignals: publicSignals,
          },
          domainId: 42, // Optional domain ID for proof aggregation
        });

events.on('includedInBlock', (eventData) => {
  console.log('Transaction included in block:', eventData);
});

events.on('finalized', (eventData) => {
  console.log('Transaction finalized:', eventData);
});

events.on('error', (error) => {
  console.error('An error occurred during the transaction:', error);
});
```

## Awaiting the Final Transaction Result

To await the final result of the transaction, use the transactionResult promise. This resolves with the final transaction details after the transaction is finalized in a block.

```typescript
const { events, transactionResult } = await session
  .verify(optionalAccountAddress) // You can pass account address here if multiple connected to your session.
  .groth16({
    library: Library.snarkjs,
    curve: CurveType.bls12381
  })
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof aggregation
  });

const result = await transactionResult;
console.log('Final transaction result:', result);
```

## Domain Specific Proof Aggregation

* Proofs can be aggregated by sending them to a specified Domains `domainId`.
* Domains are registered with the following properties:
  * `aggregationSize`: Maximum number of proofs to aggregate.  An integer smaller equal than 128.
  * `queueSize` The maximum number of aggregated proofs that can be waiting for publication.  An optional integer smaller equal than 16. 16 if it’s null
* Once proofs are sent to a Domain and the `aggregationSize` is reached, aggregate and placed into the Publish Queue.
* Published aggregations emit a `NewAggregationReceipt` containing the following:
  * `domainId`:  The domain where the aggregation was published from.
  * `aggregationId`: The aggregation identifier
  * `receipt`: The aggregation receipt (a merkle root)

These `NewAggregationReceipt` events can then trigger aggregations to be published to a destination chain.


### Waiting for a published Proof Aggregation Receipt

In order to wait for a published aggregation receipt event `NewAggregationReceipt` the `waitForAggregationReceipt` feature can be used:

```typescript
// Pre-registered domain
const domainId = 1;
// Start session
const session = await zkVerifySession.start().zkVerify().withAccount(process.env.seedPhrase);

const { events, transactionResult } = await session
        .verify()
        .ultraplonk({
          numberOfPublicInputs: 1
        })
        .execute({
          proofData: {
            proof: proof,
            //publicSignals: publicSignals, // Not required for ultraplonk
            vk: vk,
          },
          domainId,
        });

const transactionInfo = await transactionResult;

const receipt = await session.waitForAggregationReceipt(transactionInfo.domainId!, transactionInfo.aggregationId!);

// Do something with transactionInfo and receipt
```

* Note:  Verify transactions sent without a `domainId` will not be aggregated, there will be no `NewAggregationReceipt` containing the proof.

## Optimistic Proof Verification

In order to get a quick response on whether a proof is valid or not without waiting for the network / block inclusion / finality, the `optimisticVerify` function is provided.

Under the hood this is a wrapper around the `system_dryRun` RPC, which public zkVerify RPC nodes do not expose. Use a `Custom` session pointing at a node you run with the unsafe RPC flags:

**⚠ WARNING:**
**Bear in mind unlike regular transactions, dryRun does not consume gas or fees, meaning it can be called repeatedly without cost to the user - consuming CPU and memory resources on the node and leaving it exposed to denial of service.**

```shell
--rpc-methods Unsafe --unsafe-rpc-external
```

Connect to your custom node that has the unsafe flags set, and send the proof:

```typescript
// Optimistically verify the proof (requires Custom node running in unsafe mode for dryRun() call)
const session = await zkVerifySession
  .start()
        .Custom({
          websocket: "wss://my-custom-node",
          rpc: "https://my-custom-node"
        })
  .withAccount('your-seed-phrase');

const { success, type, message } = await session
  .optimisticVerify() // Optionally pass an account address if multiple are connected
  .risc0({
    version: Risc0Version.V3_0
  })
  .withRegisteredVk() // optional
  .nonce(1) // optional nonce
  .atBlock(blockHashOrNumber) // optional: dry run against a specific block instead of the best block
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  });
```

## Batch Optimistic Proof Verification

You can optimistically verify your batch like so:

```typescript
const { success, message, failedIndex } = await session
  .batchOptimisticVerify()
  .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
  .execute([
    {
      proofData: {
        vk: vk,
        proof: proof,
        publicSignals: publicSignals,
      },
      domainId: 42, // Optional domain ID for proof categorization
    },
    {
      proofData: {
        vk: vk,
        proof: proof,
        publicSignals: publicSignals,
      },
      domainId: 42, // Optional domain ID for proof categorization
    },
  ]);
```

Note: if any proof fails, `success` will be false, `message` describes the failure and, when it can be attributed, `failedIndex` is the index of the failing proof.

## Domain Management (Aggregate Pallet)

It is possible to define a domain that has some properties and an owner.  The following flow shows how to register, hold and unregister a domain:

`registerDomain(aggregationSize, queueSize?, domainOptions, signerAccount?)` — `aggregationSize` must be 1–128 inclusive; `queueSize` must be 1–16 inclusive and defaults to 16 when omitted (passing `0` throws — the default only applies when the argument is not supplied).

```typescript
const session = await zkVerifySession
        .start()
        .zkVerify()
        .withAccount("my seed phrase");

// Register a Domain
// Without needing events
const domainOptions = {
  destination: Destination.None,
  aggregateRules: AggregateSecurityRules.Untrusted,
  proofSecurityRules: ProofSecurityRules.Untrusted,
};
const registered = await session.registerDomain(1, 1, domainOptions).transactionResult;
console.log(registered.domainId);
// If you want to listen to events and also get the transactionResult
const { events: registerEvents, transactionResult: registerResult } = session.registerDomain(1, 2, domainOptions);

// Listen for events if needed
registerEvents.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
    console.log("IncludedInBlock");
});

registerEvents.on(ZkVerifyEvents.Finalized, (eventData) => {
  console.log("Finalized");
});

registerEvents.on(ZkVerifyEvents.ErrorEvent, (eventData) => {
  console.log("ErrorEvent");
});

// await the transactionResult
const registerInfo = await registerResult;
const domainId = registerInfo.domainId!;

// Hold a Domain
// Without events
const held = await session.holdDomain(domainId).transactionResult;
// With events
const { events: holdEvents, transactionResult: holdResult } = session.holdDomain(domainId);

// Listen for events if needed
holdEvents.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
  console.log("IncludedInBlock");
});

holdEvents.on(ZkVerifyEvents.Finalized, (eventData) => {
  console.log("Finalized");
});

holdEvents.on(ZkVerifyEvents.ErrorEvent, (eventData) => {
  console.log("ErrorEvent");
});

// await transaction
const holdInfo = await holdResult;
console.log(holdInfo.domainState);

// Unregister a Domain (once it is in the Removable state)
// Without events
const unregistered = await session.unregisterDomain(domainId).transactionResult;
// With events
const { events: unregisterEvents, transactionResult: unregisterResult } = session.unregisterDomain(domainId);

// Listen for events if needed
unregisterEvents.on(ZkVerifyEvents.IncludedInBlock, () => {
    console.log("IncludedInBlock");
});

unregisterEvents.on(ZkVerifyEvents.Finalized, () => {
    console.log("Finalized");
});

unregisterEvents.on(ZkVerifyEvents.ErrorEvent, () => {
    console.log("ErrorEvent");
});

// await transactionResult
const unregisterInfo = await unregisterResult;
console.log(unregisterInfo.domainState);
```

## Example Usage

### Verify Proof, listen to related transaction events.

```typescript
import { zkVerifySession, ZkVerifyEvents, Risc0Version, VerifyTransactionInfo } from 'zkverifyjs';

async function executeVerificationTransaction(proof: unknown, publicSignals: unknown, vk: unknown) {
  // Start a new zkVerifySession on a Custom network (replace 'your-seed-phrase' and 'my-custom-node' with actual value)
  const session = await zkVerifySession.start()
          .Custom({
            websocket: "ws://my-custom-node",
            rpc: "https://my-custom-node"
          })
          .withAccount('your-seed-phrase');
  
  // Optimistically verify the proof (requires Custom node running in unsafe mode for dryRun() call)
  const { success, message } = await session.optimisticVerify() // Optionally pass an account address
          .risc0({
            version: Risc0Version.V3_0
          })
          .execute({ proofData: {
              vk: vk,
              proof: proof,
              publicSignals: publicSignals },
              domainId: 42 // Optional domain ID for proof categorization
          });

  if (!success) {
      throw new Error(`Optimistic Proof Verification Failed: ${message}`);
  }
  
  // Add additional dApp logic using fast response from zkVerify
  // Your logic here
  // Your logic here

  // Execute the verification transaction on zkVerify chain
  const { events, transactionResult } = await session.verify()
          .risc0({
            version: Risc0Version.V3_0
          })
          .execute({ proofData: {
              vk: vk,
              proof: proof,
              publicSignals: publicSignals },
              domainId: 42 // Optional domain ID for proof categorization
          });

  // Listen for the 'includedInBlock' event
  events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
    console.log('Transaction included in block:', eventData);
    // Handle the event data as needed
  });

  // Listen for the 'finalized' event
  events.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Transaction finalized:', eventData);
    // Handle the event data as needed
  });

  // Handle errors during the transaction process
  events.on(ZkVerifyEvents.ErrorEvent, (error) => {
    console.error('An error occurred during the transaction:', error);
  });

  try {
    // Await the final transaction result
    const transactionInfo: VerifyTransactionInfo = await transactionResult;

    // Log the final transaction result
    console.log('Transaction completed successfully:', transactionInfo);
  } catch (error) {
    // Handle any errors that occurred during the transaction
    console.error('Transaction failed:', error);
  } finally {
    // Close the session when done
    await session.close();
  }
}

// Replace these variables with actual proof data
const proof = /* Your proof data */;
const publicSignals = /* Your public signals */;
const vk = /* Your verification key */;

// Execute the transaction
executeVerificationTransaction(proof, publicSignals, vk);
```

### Subscribing to events.

```typescript
  const session = await zkVerifySession.start()
          .Custom({
            websocket: "ws://my-custom-node",
            rpc: "https://my-custom-node"
          })
          .withAccount('your-seed-phrase');


  const subscriptionEvents = session.subscribe([
    {
      event: ZkVerifyEvents.NewAggregationReceipt,
      callback: (eventData) => {
        console.log('Received NewAggregationReceipt event:', eventData);
      },
      options: {
        domainId: 1
      }
    },
    {
      event: ZkVerifyEvents.ProofVerified,
      callback: (eventData) => {
        console.log('Proof verified successfully:', eventData);
      }
    },
    {
      event: ZkVerifyEvents.AggregationComplete,
      callback: (eventData) => {
        console.log('Aggregation process completed:', eventData);
      }
    }
  ]);

  // Subscription failures and timeouts are reported here
  subscriptionEvents.on(ZkVerifyEvents.ErrorEvent, (error) => {
    console.error('Subscription error:', error);
  });
```

# API Reference

## `zkVerifySession.start`

```typescript
// Pick ONE network, then at most ONE session mode.
const session = await zkVerifySession.start()
        .zkVerify() // Network: .zkVerify(), .Volta() or .Custom({...})
        .withAccount(process.env.SEED_PHRASE!); // Mode: .withAccount(), .withAccounts(), .withWallet() or .readOnly()

const custom = await zkVerifySession.start()
        .Custom({
          websocket: "wss://my-custom-node",
          rpc: "https://my-custom-node",
          network: "Volta", // Optional
        })
        .readOnly();
```

- Network Selection: Preconfigured options `.zkVerify()` (mainnet) and `.Volta()` (testnet), or your own node with `.Custom({ websocket, rpc, network? })`. For `.Custom()`, `network` selects the account address (SS58) format: pass `"Volta"` for a testnet node; any other value, or omitting it, uses the zkVerify mainnet format. Custom sessions also accept Substrate dev accounts such as `//Alice`, which `.zkVerify()` and `.Volta()` reject.
- withAccount / withAccounts: Create a full session that can send transactions and read account info, using your own seed phrase(s). Cannot be combined with `withWallet()`.
- withWallet: Connect to a browser extension wallet such as Talisman or SubWallet. Cannot be combined with `withAccount()`.
- readOnly: Start the session in read-only mode, unable to send transactions or retrieve account info. Calling the network method alone (e.g. `await zkVerifySession.start().zkVerify()`) is equivalent.
- Each mode method returns `Promise<zkVerifySession>`, so modes cannot be chained together.

### Connection tuning

`.Custom()` accepts two optional fields to control connection behavior. Useful for long-running clients that need explicit timeouts or want to control reconnect cadence.

```typescript
const session = await zkVerifySession
  .start()
  .Custom({
    websocket: "wss://my-node",
    rpc: "https://my-node",
    wsProvider: {
      autoConnectMs: 10000,  // delay between reconnect attempts (default 2500)
      timeout: 30000,        // per-request timeout in ms
    },
    syncTimeoutMs: 120000,   // give up if the node is still syncing after 120s (default 300000)
  })
  .withAccount('your-seed-phrase');
```

- `wsProvider.autoConnectMs`: ms between reconnect attempts. Pass `false` to disable auto-reconnect entirely, then subscribe to `session.provider.on('disconnected', ...)` to implement your own retry policy with a hard upper bound. This is the recommended pattern when you need to give up after N failed reconnects rather than retrying forever.
- `wsProvider.timeout`: per-request timeout in ms.
- `syncTimeoutMs`: max time to wait for the node to finish syncing during session start. Throws if exceeded. Default 5 minutes.

### Endpoint validation

The `websocket` URL is validated at session start: an unparseable URL, or a scheme other than `wss://` / `ws://`, throws. An unencrypted `ws://` endpoint on a non-loopback host still connects but logs a warning, since a network-position attacker on a plaintext connection can forge the chain state the SDK reports (including verification results). Loopback (`localhost`, `127.0.0.0/8`, `::1`) never warns.

- `allowInsecureWebSocket`: set `true` to silence the `ws://` warning for a trusted private network you control.

## `zkVerifySession.close`

```typescript
await session.close();
```
- Closes the zkVerifySession.

## `zkVerifySession.verify`

```typescript
const { events, transactionResult } = await session
  .verify()
  .ultraplonk({
    numberOfPublicInputs: 1
  })
  .nonce(1)
  .withRegisteredVk()
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      //publicSignals: publicSignals, // Not required for ultraplonk
    },
    domainId: 42, // Optional domain ID for proof categorization
  }); // 1. Directly pass proof data
// .execute({ extrinsic: submittableExtrinsic }); // 2. OR pass in a pre-built SubmittableExtrinsic
```

- Proof Type: `.ultraplonk({})` specifies the type of proof to be used and its config. Options available for all supported proof types.
- Nonce: `.nonce(1)` sets the nonce for the transaction. This is optional and can be omitted if not required.
- Registered Verification Key: `.withRegisteredVk()` indicates that the verification key being used is registered on the chain. This option is optional and defaults to false.
- Execute:  You can either send in the raw proof details using `{ proofData: ... }` or verify a prebuilt extrinsic `{ extrinsic: ... }`
- Returns: An object containing an EventEmitter for real-time events and a Promise that resolves with the final transaction result.

## `zkVerifySession.batchVerify`

```typescript
const { events, transactionResult } = await session
  .batchVerify(optionalAccountAddress) // You can pass account address here if multiple connected to your session.
  .ultraplonk({
    numberOfPublicInputs: 1
  })
  .nonce(1) // Optional
  .withRegisteredVk() // Optional
  .execute([{
    proofData: {
      vk: vk,
      proof: proof,
      //publicSignals: publicSignals, // Not required for ultraplonk
    },
    domainId: 42, // Optional domain ID for proof categorization
  },
  {
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  }
  ]); // 1. Directly pass proof data
// .execute([{ extrinsic: submittableExtrinsic1 }, { extrinsic: submittableExtrinsic2 }]); // 2. OR pass in pre-built SubmittableExtrinsics
```

- Proof Type: `.ultraplonk({})` specifies the type of proof to be used and its config. Options available for all supported proof types.
- Nonce: `.nonce(1)` sets the nonce for the transaction. This is optional and can be omitted if not required.
- Registered Verification Key: `.withRegisteredVk()` indicates that the verification key being used is registered on the chain. This option is optional and defaults to false.
- Execute:  You can either send in the raw proof details as an array using `[{ proofData: ... }, { proofData: ... }]` or verify a prebuilt extrinsic array `[{ extrinsic: ... }, { extrinsic: ... }]`. The domain ID is part of a prebuilt extrinsic, so it is not passed separately.
- Returns: An object containing an EventEmitter for real-time events and a Promise that resolves with the final transaction result.


## `zkVerifySession.optimisticVerify`

```typescript
const { success, type, message } = await session
  .optimisticVerify() // Optionally pass an account address if multiple are connected
  .groth16({
    library: Library.snarkjs,
    curve: CurveType.bn254
  })
  .withRegisteredVk() // optional
  .nonce(1) // optional
  .atBlock(blockHashOrNumber) // optional
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  });
```

- Proof Type: `.groth16({...})` specifies the type of proof to be used. Options available for all supported proof types.
- Registered Verification Key: `.withRegisteredVk()` indicates that the verification key being used is registered on the chain. This option is optional and defaults to false.
- At Block: `.atBlock(blockHashOrNumber)` runs the dry run against the given block instead of the best block. Optional.
- Execute:  You can either send in the raw proof details using `{ proofData: ... }` or verify a prebuilt extrinsic `{ extrinsic: ... }`
- Returns: `Promise<OptimisticVerifyResult>` with `success`, `type` (an `OptimisticVerificationResultType`: `ok`, `validity_error`, `dispatch_error`, `unknown_error`, `transport_error` or `exception`) and `message`, plus `code` and `verificationError` when the runtime reports them.

## `zkVerifySession.batchOptimisticVerify`

```typescript
const { success, message, failedIndex } = await session
  .batchOptimisticVerify()
  .groth16({
    library: Library.snarkjs,
    curve: CurveType.bn254
  })
  .withRegisteredVk() // optional
  .nonce(1) // optional
  .atBlock(blockHashOrNumber) // optional
  .execute([{
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  },
  {
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  }
  ]);
```

- Proof Type: `.groth16({...})` specifies the type of proof to be used. Options available for all supported proof types.
- Registered Verification Key: `.withRegisteredVk()` indicates that the verification key being used is registered on the chain. This option is optional and defaults to false.
- At Block: `.atBlock(blockHashOrNumber)` runs the dry run against the given block instead of the best block. Optional.
- Execute:  Send an array of raw proof details `[{ proofData: ... }, ...]` or prebuilt extrinsics `[{ extrinsic: ... }, ...]`.
- Returns: `Promise<OptimisticVerifyResult>`, as for `optimisticVerify`. If a specific proof caused the failure, `failedIndex` is its index in the input array.


## `zkVerifySession.registerVerificationKey`

```typescript
const { events, transactionResult } = await session
  .registerVerificationKey() // Optionally pass an account address if multiple are connected
  .ultraplonk({
    numberOfPublicInputs: 1
  })
  .nonce(1) // optional
  .execute(vk);

const { statementHash } = await transactionResult;
```

- Proof Type: `.ultraplonk({...})` specifies the type of proof and its config. Options available for all supported proof types.
- Nonce: `.nonce(1)` sets the nonce for the transaction. Optional.
- Returns: An object containing an EventEmitter and a `transactionResult` Promise resolving to `VKRegistrationTransactionInfo`, whose `statementHash` is the registered VK hash to pass as `vk` with `.withRegisteredVk()`.

## `zkVerifySession.getAggregateStatementPath`

```typescript
const result = await session.getAggregateStatementPath(aggregationReceipt.blockHash!, txInfo.domainId!, txInfo.aggregationId!, txInfo.statement!);
```

- `blockHash`: The block hash the `NewAggregationReceiptEvent` for the specified `domainId` and `aggregationId` was located
- `domainId`: The domain responsible for the aggregation
- `aggregationId`: The `aggregationId` returned in the transaction result from a successful proof verification
- `statement`: The `statement` returned in the transaction result from a successful proof verification
- Returns: An `AggregateStatementPathResult` (Merkle proof) with `root`, `proof`, `numberOfLeaves`, `leafIndex` and `leaf`.

## `zkVerifySession.getVkHash`

```typescript
const vkHash = await session.getVkHash({
  proofType: ProofType.groth16,
  config: {
    curve: CurveType.bn254,
    library: Library.snarkjs
  }
}, verificationKey);
```

- `proofOptions`: `ProofOptions` object containing the ProofType and an optional `config` object for certain proof types.
- `verificationKey`: A raw verification key from a supported library
- Returns: A verification key hash as a 0x string
- Applies the same runtime-dependent defaults and checks as `verify()` (for example the UltraHonk `version` default).

## `zkVerifySession.format`

```typescript
const { formattedVk, formattedProof, formattedPubs } = await session.format(
  {
    proofType: ProofType.ultrahonk,
    config: { version: UltrahonkVersion.V5_0, variant: UltrahonkVariant.ZK },
  },
  proof,
  publicSignals,
  vk,
  registeredVk, // optional
);
```
- `proofOptions`: `ProofOptions` object containing the `ProofType` and, for proof types that need one, a `config` object (e.g. `{ version }` for risc0).
- `proof`: The proof data that needs to be formatted.
- `publicSignals`: The public signals associated with the proof, which are also formatted.
- `vk`: The verification key, or the registered VK hash when `registeredVk` is true.
- `registeredVk`: (Optional) A boolean indicating if the verification key is already registered.
- Applies the same runtime-dependent defaults and checks as `verify()`, so proof versions the connected runtime no longer verifies are rejected before you build an extrinsic.
- Returns: A Promise that resolves to a `FormattedProofData` object containing:
  - formattedVk: The formatted verification key.
  - formattedProof: The formatted proof data.
  - formattedPubs: The formatted public signals.

## `zkVerifySession.formatVk`

```typescript
const proofOptions = {
  proofType: ProofType.groth16,
  config: {
    curve: CurveType.bls12381,
    library: Library.snarkjs,
  },
};

const formattedVk = await session.formatVk(proofOptions, vk);

```
- `proofOptions`: `ProofOptions` object containing the ProofType and an optional `config` object for certain proof types.
- `vk`: A raw verification key from a supported library
- Returns: a formatted verification key object.
- Applies the same runtime-dependent defaults as `verify()`.

## `zkVerifySession.createSubmitProofExtrinsic`

```typescript
const extrinsic = await session.createSubmitProofExtrinsic(proofType, params, domainId); // domainId optional
```

- `proofType`: ProofType enum - used to obtain the name of the pallet that contains the proof submission method.
- `params`: A FormattedProofData object containing formatted proof parameters required for the extrinsic (from `session.format`).
- `domainId`: (Optional) Domain ID for proof aggregation.
- Returns: A Promise that resolves to a `SubmittableExtrinsic<'promise'>`, allowing you to submit the proof to the blockchain.

## `zkVerifySession.createExtrinsicHex`

```typescript
const hex = await session.createExtrinsicHex(proofType, params, domainId); // domainId optional
```

- `proofType`: ProofType enum - used to obtain the name of the pallet that contains the proof submission method.
- `params`: A FormattedProofData object of formatted proof parameters needed for the extrinsic.
- `domainId`: (Optional) Domain ID for proof aggregation.
- Returns: A Promise that resolves to a hex-encoded string representing the SubmittableExtrinsic.

## `zkVerifySession.createExtrinsicFromHex`

```typescript
const extrinsic = await session.createExtrinsicFromHex(extrinsicHex);
```

- `extrinsicHex`: A string representing the hex-encoded SubmittableExtrinsic to be reconstructed.
- Returns: A Promise that resolves to a `SubmittableExtrinsic<'promise'>`, allowing you to interact with the reconstructed extrinsic.
- Only reconstruct hex produced by `createExtrinsicHex` on a host you trust. When an extrinsic is passed to `verify`, `batchVerify` or `optimisticVerify`, the SDK signs it only if it is the `submitProof` call of the verifier pallet for the declared proof type; any other call is rejected.

## `zkVerifySession.estimateCost`

```typescript
const estimate: ExtrinsicCostEstimate = await session.estimateCost(extrinsic);
```

- `extrinsic`: A submitProof SubmittableExtrinsic.
- Returns: A Promise that resolves to an ExtrinsicCostEstimate:
  ```
  partialFee: string;
  estimatedFeeInTokens: string;
  weight: string;
  length: number;
  ```
  
## `zkVerifySession.getAccountInfo`

```typescript
const accountInfo: AccountInfo[] = await session.getAccountInfo(); // Optionally pass an account address to get just that account
console.log(accountInfo[0].address);
console.log(accountInfo[0].nonce);
console.log(accountInfo[0].freeBalance);
console.log(accountInfo[0].reservedBalance);
```
- Returns an array of account information: address, nonce, freeBalance and reservedBalance. Full session only, will not work in readOnly mode.

## `zkVerifySession.addAccount`

```typescript
await session.addAccount(seedPhrase);
```

- `seedPhrase`: Your seed phrase as a string "my seed phrase"
- Returns: `Promise<string>` Account Address, which is also required as an input for removeAccount().
- Adds the account to the current session

### `zkVerifySession.addAccounts`

```typescript
await session.addAccounts([seedPhrase1, seedPhrase2, seedPhrase3, seedPhrase4]);
```

- `[seedPhrase]`: Your seed phrases as a string array ["my seed phrase 1", "my seed phrase 2"]'
- Returns: `Promise<string[]>` Account Address array, which is also required as an input for removeAccount().
- Adds the accounts to the current session

### `zkVerifySession.addDerivedAccounts`

```typescript
// Add 5 derived child accounts from an existing base account to the zkVerify session:
const baseAddress = (await session.getAccountInfo())[0].address;
const derivedAddresses = await session.addDerivedAccounts(baseAddress, 5);
```

- `baseAddress`: Address of an account that already exists in the current session.
- `count`: How many derived accounts to add.
- Returns: `Promise<string[]>` – SS58-encoded addresses that were added.

## `zkVerifySession.removeAccount`

```typescript
// Remove specific account
await session.removeAccount(accountAddress);
// Remove account if only one exists
await session.removeAccount();
```

- `accountAddress`: The account address to remove, in string format.
- Removes specified accountAddress from the active accounts list.
- If no accountAddress is provided and exactly one account exists, that account is removed.
- If no accounts remain after removal, the session transitions to read-only mode.
- If the session is already in read-only mode, calling this method has no effect.

## `zkVerifySession.getAccount`

```typescript
// Return sole KeyringPair if only one account is connected
const account = session.getAccount();

// Return specific KeyringPair if multiple accounts are connected
const account2 = session.getAccount("myAccountAddress");
```
- Returns: The KeyringPair object representing the account. If no address is given and several accounts are connected, the first one is returned.
- The account is used for signing transactions and interacting with the blockchain on behalf of the user.
- Throws if the session has no accounts (read-only or wallet sessions) or the requested account does not exist.

## `zkVerifySession.subscribe`

```typescript
const emitter = session.subscribe(subscriptions);
```
- Returns: an `EventEmitter`. Callbacks in `subscriptions` are invoked, and every event is also emitted on the returned emitter.
- `subscriptions` (Optional): An array of subscription objects (SubscriptionEntry[]). Omit it to subscribe to all public events (`NewAggregationReceipt`, `ProofVerified`, `NewProof`, `VkRegistered`, `NewDomain`, `DomainStateChanged`, `AggregationComplete`). Each subscription object contains:
  - `event`: The name of the event to subscribe to. This must be a value from `ZkVerifyEvents`.
  - `callback` (Optional): A function to be called whenever the specified event occurs. Receives an event object as its argument.
  - `options` (Optional): A NewAggregationEventSubscriptionOptions object used to filter which events to listen to. This is only relevant for NewAggregationReceipt events.

`options` Usage:

- `undefined`: Subscribe to all NewAggregationReceipt events across all domains.
- `{ domainId }`: Subscribe to all receipts for a specific domain.

Notes:

- Attach an `error` listener to the returned emitter. A subscription that fails or times out is reported there, and `error` events are only delivered when a listener is attached.
- `NewAggregationReceipt` is read from finalized blocks. The other runtime events (`ProofVerified`, `NewProof`, `VkRegistered`, `NewDomain`, `DomainStateChanged`, `AggregationComplete`, `CannotAggregate`) follow the best chain and can be delivered for a block that is later discarded by a fork. Act on `transactionResult`, the `finalized` event or `waitForAggregationReceipt` when finality matters.

## `zkVerifySession.waitForAggregationReceipt`

```typescript
const receipt: NewAggregationReceipt = await session.waitForAggregationReceipt(domainId, aggregationId, timeoutMs);
```
- `domainId`: The integer value of the domainId expected to aggregate your proof
- `aggregationId`: The integer value of the aggregationId you want to wait for.
- `timeout`: (Optional) Milliseconds to wait before rejecting.
- Returns: A Promise resolving to the `NewAggregationReceipt` (`blockHash`, `domainId`, `aggregationId`, `receipt`) once it is published in a finalized block.

## `zkVerifySession.unsubscribe`

```typescript
session.unsubscribe();
```
- This method unsubscribes from any active NewAggregationReceipt event subscriptions. It is used to stop listening for NewAggregationReceipt events when they are no longer needed.

## `zkVerifySession.aggregate`

```typescript
session.aggregate(domainId, aggregationId);
```
- publish aggregation for a specified `domainId` and `aggregationId`.
* @param `{number}` domainId - The domain to publish.
* @param `{number}` aggregationId: The aggregationId to publish.
* Returns `{ events: EventEmitter; transactionResult: Promise<AggregateTransactionInfo> }`

AggregateTransactionInfo contains a `receipt` populated by the `NewAggregationReceipt` event.

## `zkVerifySession.registerDomain`

```typescript
const { events, transactionResult } = session.registerDomain(aggregationSize, queueSize, domainOptions, accountAddress);
```
- register a new domain where the owner is the signer that emits a new aggregation every aggregationSize proofs and where there could be at most  queueSize aggregation in waiting for publication state.
* @param `{number}` aggregationSize - The size of the aggregation, an integer from 1 to 128.
* @param `{number}` queueSize: an integer from 1 to 16. Pass `undefined` to use the default of 16.
* @param `{DomainOptions}` domainOptions: additional options required to register the domain.
  - `destination`: Destination type (Destination.None)
  - `aggregateRules`: Security rules for aggregation (AggregateSecurityRules)
  - `proofSecurityRules`: **(v1.3.0+ REQUIRED)** Security rules for proof submission (ProofSecurityRules)
  - `deliveryOwner`: Optional account address for delivery ownership
* @param `{string}` accountAddress - Optionally provide an account address attached to the session to send the transaction from.
* Returns `{ events: EventEmitter; transactionResult: Promise<RegisterDomainTransactionInfo> }`

**Note for v1.3.0+**: The `proofSecurityRules` parameter is required for network runtimes v1.3.0+.

Note: Need to hold the currency proportional to the size of aggregations and queue. The currency will be returned if the domain is unregistered

## `zkVerifySession.holdDomain`

```typescript
session.holdDomain(domainId, accountAddress?);
```
- put the domain in Hold or Removable state. The state depends if there are some statements that need to be aggregated yet in this domain;  in these states the domain doesn’t accept any other proof but it still remains active for aggregating till there are some aggregations to aggregate. Only the Domain’s owner and the manager can call it
* @param `{number}` domainId - The ID of the domain to hold.
* @param `{string}` accountAddress - Optionally provide an account address attached to the session to send the transaction from.
* Returns `{ events: EventEmitter; transactionResult: Promise<DomainTransactionInfo> }`

## `zkVerifySession.unregisterDomain`

```typescript
session.unregisterDomain(domainId, accountAddress?);
```
- remove a registered domain in the "Removable" state, refund the owner with the held currency. If everything is ok it will emit a DomainStateChanged event with Removed state.
* @param `{number}` domainId - The ID of the domain to unregister.
* @param `{string}` accountAddress - Optionally provide an account address attached to the session to send the transaction from.
* Returns `{ events: EventEmitter; transactionResult: Promise<DomainTransactionInfo> }`

## `zkVerifySession.addDomainSubmitters`

**Available in runtime v1.3.0+ only**

```typescript
session.addDomainSubmitters(domainId, submitters, accountAddress?);
```

* Adds account addresses to the allowlist for proof submission on a domain configured with `ProofSecurityRules.OnlyAllowlisted`.
* @param `{number}` domainId - The ID of the domain.
* @param `{string[]}` submitters - Array of account addresses to add to the allowlist.
* @param `{string}` accountAddress - Optionally provide an account address attached to the session to send the transaction from.
* Returns `{ events: EventEmitter; transactionResult: Promise<DomainTransactionInfo> }`
* @throws Will throw an error if called on runtime version < 1.3.0

## `zkVerifySession.removeDomainSubmitters`

**Available in runtime v1.3.0+ only**

```typescript
session.removeDomainSubmitters(domainId, submitters, accountAddress?);
```

* Removes account addresses from the allowlist for a domain configured with `ProofSecurityRules.OnlyAllowlisted`.
* @param `{number}` domainId - The ID of the domain.
* @param `{string[]}` submitters - Array of account addresses to remove from the allowlist.
* @param `{string}` accountAddress - Optionally provide an account address attached to the session to send the transaction from.
* Returns `{ events: EventEmitter; transactionResult: Promise<DomainTransactionInfo> }`
* @throws Will throw an error if called on runtime version < 1.3.0
* Note: Removing the last submitter from a domain may emit a `DomainStateChanged` event.

## `zkVerifySession.api`

```typescript
const api = session.api;
```
- Uses Polkadot.js API 17.0.1
- Returns: The ApiPromise instance connected to the Polkadot.js API.
- This is the main API object used to interact with the blockchain. It provides methods for querying the chain state, submitting extrinsics, subscribing to events, and more.

## `zkVerifySession.provider`

```typescript
const provider = session.provider;
```
- Returns: The WsProvider instance connected to the WebSocket endpoint.
- The provider manages the connection to the blockchain node. It handles WebSocket communication and can be used to interact with the node directly, such as for subscribing to updates or making RPC calls.

## `zkVerifySession.connection`

```typescript
const { api, provider, runtimeSpec } = session.connection;
console.log(runtimeSpec.specName, runtimeSpec.specVersion);
```
- Returns: The connection details for the session: `api`, `provider` and `runtimeSpec`, plus the connected accounts or wallet for full sessions.
- `runtimeSpec.specVersion` follows runtime upgrades enacted while the session is open.

## `zkVerifySession.readOnly`

```typescript
if (session.readOnly) {
  // Cannot send transactions
}
```
- Returns: `true` when the session has no accounts or wallet attached.

## Runtime version helpers

Helpers to branch on the runtime version of the connected network:

```typescript
import { isVersionAtLeast, requireVersionAtLeast, RuntimeVersion } from 'zkverifyjs';

const { runtimeSpec } = session.connection;

if (isVersionAtLeast(runtimeSpec, RuntimeVersion.V2_1_0)) {
  // e.g. UltraHonk V5_0 is available
}

requireVersionAtLeast(runtimeSpec, RuntimeVersion.V2_1_0, 'UltraHonk V5_0'); // Throws on older runtimes
```

- `isVersionAtLeast(runtimeSpec, version)`, `isVersionBetween(runtimeSpec, min, max)` and `isVersionExactly(runtimeSpec, version)` return booleans.
- `requireVersionAtLeast(runtimeSpec, version, featureName)` throws if the runtime is older than `version`.
- `fetchRuntimeVersion(api)` reads the runtime spec from an `ApiPromise`.

## Testing

To run the tests, use the following command:

```shell
npm test
```