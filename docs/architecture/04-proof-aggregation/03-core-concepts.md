---
title: Concepts
---
### Domains

Domains are logical containers for aggregating statements. Each domain has:
- An owner who can manage and unregister the domain
- Configurable aggregation size (i.e. how many proof verification results it is possible to aggregate at a time) and queue size (how many aggregation results can be kept in storage before publishing them)
- Security rules for controlling who can aggregate statements
- Optional delivery parameters for dispatching aggregations to other chains

### Domain States

Domains can exist in the following states:
- `Ready`: Active and can receive new statements
- `Hold`: Cannot receive new statements but can publish existing aggregations
- `Removable`: Ready to be unregistered (no pending aggregations)
- `Removed`: Domain has been removed

### Aggregation Security Rules

Controls who can trigger aggregations:
- `Untrusted`: Anyone can call aggregate
- `OnlyOwner`: Only domain owner and pallet manager can call aggregate
- `OnlyOwnerUncompleted`: Anyone can aggregate completed collections, but only owner/manager can aggregate incomplete ones


## Actors

### Manager

An account able to execute any extrinsic of the Aggregate pallet over any domain without restrictions and without paying fees.
The manager role is determined by the runtime configuration through the ManagerOrigin type, which is a custom origin check defined in the chain's runtime.

### Domain Owner

An account able to execute any extrinsic of the Aggregate pallet over a given domain.
The account calling the register_domain extrinsic is set to be the owner of the registered domain.

### Aggregator

The one responsible for calling the aggregate() extrinsic.
Aggregation is a permissionless task, and it is rewarded. In particular:
- Whoever calls aggregate will be refunded with the cost for executing the extrinsic
- It will be also rewarded with an additional tip, configurable at runtime level (In the future each domain will be able to specify its own tip)

Users submitting proofs will equally split both costs, in an amount proportional to the aggregation size.

### Delivery Owner

An account responsible for managing and executing all the on-chain actions required to ensure a successful delivery of a given aggregation according to the delivery mechanism specified within the domain.
One of its main responsibilities, for instance, is to set an appropriate delivery price to be sure that the actors responsible for the delivery (e.g. Hyperbridge Relayers) will accept the delivery request and perform their duty; this could involve, for instance, monitoring the fees on the destination chain and computing the appropriate conversion rate, communicating with the entity running the relayer, etc.

The cost for delivery is split equally among all the proof submitters, according to the aggregation size.
Please note that the delivery owner could set a bigger price than the actual one, to make a profitable margin for itself and be rewarded for the duties it is responsible for.