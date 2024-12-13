---
title: Domain Management
---

A domain is identified by an identifier and identifies a class of aggregation and its key properties

- Aggregation size
- Publishing queue size

Everyone can create a new domain and become the owner. The owner should hold some founds in order to create a new domain, the hold amount depends on the size of both aggregation and queue that the domain define and these found will be released when the domain is removed.

## Create a new domain

To create a new domain the owner should call [`registerDomain(aggregationSize, queueSize)`](../02-mainchain/05-mainchain_api.md#registerdomain) extrisic and define both aggregation size and queue size.

The aggregation size should be any unsigned integer smaller than 128, but because it represents a Merkle tree size is better to use a power of two. From the aggregation size a proof submitter that would use this domain can estimate what will be the cost of check his proof presence in the aggregation receipt in the destination chain where he wants to use his proof: a bigger size means a bigger cost on check it, but also a lower cost send the proof on the destination chain due the bridge cost is amortized by more proofs in the same attestation.

The publishing queue size should be an unsigned integer smaller or equal than 16 and represent how many aggregations can wait for publication: a lower number can generate a more common `CannotAggregate(DomainFull)` event on submitting proof because there is not enough buffer in the publication queue, on the other side use a bigger aggregation size means hold more money.

If the owner has not enough founds to cover the storage cost needed to maintain the domain the `registerDomain` call fails, otherwise the founds are put on hold for all domain life.

## Remove a domain

In order to remove a domain the owner should first put it on hold in and then unregister it. When a domain is in `Hold` state it doesn't accept any proofs, and it remains in this state till there are some aggregations in this domain that should be still aggregated. When there are no aggregation that should be published in this domain the domain change its state in `Removable`.

To put the domain on `Hold` the owner should use [`holdDomain(domainId)`](../02-mainchain/05-mainchain_api.md#holddomain) extrinsic that emit a [`DomainStateChanged{id, state}`](../02-mainchain/05-mainchain_api.md#domainstatechanged) where the state can be `Hold` if there are aggregations that are not published yet or `Removable` otherwise. If the domain is in `Hold` state every time that a new aggregation in this domain is published via `aggregate` extrinsic the state can change and a new [`DomainStateChanged{id, state}`](../02-mainchain/05-mainchain_api.md#domainstatechanged) can be emitted with the `Removable` state.

When a domain is in `Removable` state the [`unregisterDomain(domainId)`](../02-mainchain/05-mainchain_api.md#unregisterdomain) the owner can call it and all hold funds the owner bond on this domain are unlocked and a [`DomainStateChanged{id, Removed}`](../02-mainchain/05-mainchain_api.md#domainstatechanged) event is emitted.
