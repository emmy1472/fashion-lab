# Change log for: @freesewing/bee


## 4.0.1 (2025-06-09)

### Added

 - Added the `duoNeckTieColours` option
 - Added the `duoBandTieColours` option
 - Added the `pointedNeckTieEnds` option
 - Added the `pointedBandTieEnds` option

### Changed

 - Reinstating the ability to toggle the colours of neck and band tie independently
 - Reinstating the ability to toggle pointed edge of neck and band tie independently
 - Simplify snap options
 - Simplify Cutting Instructions
 - Hidden tie flag message also now appears when `options.ties` is not set
 - Neck tie is no longer hidden when `options.pointedNeckTieEnds` is `true`
 - Band tie is no longer hidden when `options.crossBackTies` is `true`
 - Band tie is no longer hidden when `options.pointedBandTieEnds` is `true` and `options.crossBackTies` is not set
 - The `reversible` optinon now acts as an override for the `duoNeckTieColours` and `duoBandTieColours` options
 - Updated `neckTieLength` when `crossBackTies` is `true`
 - Designer note links updated for new options

### Fixed

 - Neck ties no longer shown to be cut on fold
 - Band tie locks in duo colours when `options.crossBackTies` is true (fixes incorrect notch placements)

## 3.1.0 (2023-12-26)

### Changed

 - Rephrased flag message when expand is off to avoid confusion about included seam allowance. Fixes

## 3.0.0 (2023-09-30)

### Changed

 - All FreeSewing packages are now ESM only.
 - All FreeSewing packages now use named exports.
 - Dropped support for NodeJS 14. NodeJS 18 (LTS/hydrogen) or more recent is now required.

## 2.21.0 (2022-06-27)

### Changed

 - Migrated from Rollup to Esbuild for all builds

## 2.20.1 (2022-01-27)

### Changed

 - Exposed additional Bella options

## 2.20.0 (2022-01-24)

### Changed

 - Re-structured option groups
 - Expose all options to the user that should be configurable
 - Hide/lock options that should be fixed (inherited from Bella)
 - Switched to default import for version from package.json

## 2.19.0 (2021-10-17)

### Added

 - Bee is a bikini
 - Initial release


This is the **initial release**, and the start of this change log.

> Prior to version 2, FreeSewing was not a JavaScript project.
> As such, that history is out of scope for this change log.

