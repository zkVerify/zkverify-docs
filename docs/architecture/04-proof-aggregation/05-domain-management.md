---
title: Domain Management
---

A domain is identified by an identifier and defines a class of aggregation and its key properties

- Aggregation size
- Publishing queue size

Anyone can create a new domain and become the owner. The owner should hold some funds in order to create a new domain, where the hold amount depends on the size of both aggregation and queue. Funds will be released when the domain is removed.

## Create a new domain

To create a new domain the owner should call [`registerDomain(aggregationSize, queueSize)`](../02-mainchain/04-mainchain_api.md#registerdomain) extrisic and define both aggregation size and queue size.

The aggregation size should be any unsigned integer smaller than 128, but because it represents a Merkle tree size is better to use a power of two. From the aggregation size a proof submitter that would use this domain can estimate what will be the cost of the membership proof in the aggregation receipt in the destination chain where he wants to use his proof: a bigger size means a bigger cost, but also a lower cost to send the proof on the destination chain since the bridging cost will be amortized by more proofs in the same aggregation.

The publishing queue size should be an unsigned integer smaller or equal than 16 and represents how many aggregations can wait for publication: a smaller number can generate a more common `CannotAggregate(DomainFull)` event on proof submission because there is not enough buffer in the publication queue, on the other side using a bigger aggregation size means hold more money.

If the owner has not enough funds to cover for the storage cost needed to maintain the domain the `registerDomain` call fails, otherwise the funds are put on hold for all the domain's life.

## Remove a domain

In order to remove a domain the owner should first put it on hold in and then unregister it. When a domain is in `Hold` state it doesn't accept any proof, and it remains in this state till there are some pending aggregations. When there aren't anymore aggregations that should be published in this domain, the domain will change its state in `Removable`.

To put the domain on `Hold` the owner should use the [`holdDomain(domainId)`](../02-mainchain/04-mainchain_api.md#holddomain) extrinsic that emits a [`DomainStateChanged{id, state}`](../02-mainchain/04-mainchain_api.md#domainstatechanged) event, putting the state on `Hold` if there are aggregations that are not published yet, or `Removable` otherwise. If the domain is in `Hold` state, every time that a new aggregation in this domain is published via the `aggregate` extrinsic, the state can change and a new [`DomainStateChanged{id, state}`](../02-mainchain/04-mainchain_api.md#domainstatechanged) can be emitted with the `Removable` state.

When a domain is in `Removable` state the [`unregisterDomain(domainId)`](../02-mainchain/04-mainchain_api.md#unregisterdomain) can be called by the domain's owner; all the owner's bonded funds are unlocked and a [`DomainStateChanged{id, Removed}`](../02-mainchain/04-mainchain_api.md#domainstatechanged) event is emitted.

## System Domains

We provide some `System Domains`, e.g. domains that are pre-registered and configured according to different rules.
For each of these domains, we are providing the following guarantees:

- Whenever an aggregation is ready to be published, or according to other internal policies (e.g. a timeout), our Aggregator Service will take care of calling the aggregate extrinsic
- For domains with Mechanism “Bot”, we are running an off-chain relayer that listens to all the new Aggregation Receipt events, and takes care of publishing the receipt on the specified destination chain
- For domains with Hyperbridge support, we are running our own relayers to the Hyperbridge chain and we are taking care of the costs (for now).

[Please find the list below](#listdomains)

For the addresses of the contracts we have deployed on all the destination chains, please refer to the appropriate [section](../../overview/06-contract-addresses.md) of the docs.

| Domain ID | Chain             | Mechanism   |
| --------- | ----------------- | ----------- |
| 113         | Horizen Testnet  | Bot         |
| 0         | Ethereum Sepolia  | Bot         |
| 1         | Ethereum Sepolia  | Hyperbridge |
| 2         | Base Sepolia      | Bot         |
| 3         | Optimism Sepolia  | Bot         |
| 4         | Arbitrum Sepolia  | Bot         |
| 5         | Arbitrum Sepolia  | Hyperbridge |
| 56        | EDU Chain Testnet | Bot         |
