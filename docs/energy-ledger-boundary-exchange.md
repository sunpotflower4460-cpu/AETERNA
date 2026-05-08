# EnergyLedger Boundary Exchange Term

## Purpose

This note records the v3.5.1 audit correction to the shared EnergyLedger.

Previously, some boundary-side quantities were forced into `actuationOutputEnergy` to make the ledger close. That was semantically too broad.

`actuationOutputEnergy` should mean modeled action/output.

Boundary-side exchange is now represented separately as:

```text
boundaryExchangeEnergy
```

## Accounting equation

The shared check is now:

```text
inputEnergy
= internalAccumulationDelta
+ dissipatedEnergy
+ actuationOutputEnergy
+ residueConvertedEnergy
+ boundaryExchangeEnergy
+ clampLossOrOverflow
+ measuredOutflowEnergy
± tolerance
```

`boundaryExchangeEnergy` is optional and defaults to zero when omitted.

## SpatialWorldMedium usage

`SpatialWorldMedium` still reports its domain-specific field as:

```text
membraneExchangeEnergy
```

But when it sends the value into the shared EnergyLedger, it maps it to:

```text
boundaryExchangeEnergy: membraneExchangeEnergy
actuationOutputEnergy: 0
```

This preserves the distinction:

- membrane/boundary-side exchange is not action/output
- action/output remains explicit and can stay zero
- the ledger can still close without semantic overloading

## Runtime boundary

This change does not couple membrane exchange into AETERNA internal buffers.

It does not modify runtime dynamics.

It is an accounting correction only.
