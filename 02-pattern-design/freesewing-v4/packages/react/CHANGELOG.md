# Change log for: @freesewing/react


## 4.1.0 (2025-06-29)

### Added

 - Added ARCH D and ARCH E paper sizes to export
 - Added ability to unfreeze an account in the in Admin component

### Fixed

 - Fix Pattern Layout counter-clockwise button (#453)
 - Fixed issue with custom pattern layout not getting applied (#241)
 - Fixed crash in pattern layout view (#340)
 - Show snapped value for snapped percentage options with toAbs() set

## 4.0.1 (2025-06-09)

### Added

 - Add inline help to the Editor
 - Added new useFilter hook

### Changed

 - Changed maximum value for margin between parts to 3 cm
 - Improvements to the Editor inspect view
 - PDF cover pages improvements in Editor
 - Change imperial step to 1/16 inch
 - Replace the flag number with a colored badge
 - Migrated from helpProvider to Help components in the Editor

### Fixed

 - Fixed issues with the pattern export feature in the Editor (#218)
 - Added Jane to the Linedrawing component (#211)
 - Do not apply null layout in the editor (#219)
 - Fixed Editor to force the measurements view when measurements are missing
 - Seam allowance slider (#210)
 - Fix issues with pattern export (#218)
 - When sampling options, also test different settings for sa, paperless, and complete (#225)
 - Do not rely on initial settings in the Editor
 - Fixed issue with translations (#244)
 - Fix weird slider behaviour when entering the default value ()#246)
 - Fix the inspect view popup when clicking on a path or point, fix missing translations in the xray path and point components (#256)
 - Fix pattern reset button (#258)
 - Fix deselecting included parts (#259)
 - Fix sampleMeasurement button
 - Fix button state for boolean core options (#229)
 - Respect user account units in the editor
 - Fixes to the Editor header
 - Always add bounding box in tiler plugin (#273)
 - Escape user-provided text in SVG (#260)
 - Pattern layout print settings UI fixes (#351)
 - Allow bookmark title to be edited
 - Fix Collection background image URL
 - Ignore pointer events on tooltip text of Xray point component
 - Add URL formats to Bookmarked Set picker
 - Improve resilience of Editor sample menu when translations are missing
 - Change the expand icon to have the arrows point inwards if expand is disabled
 - Gracefully fail the Editor when a part translation is not available

## 4.0.0 (2025-04-01)

### Added

 - The `@freesewing/react` package holds shared components, hooks, and context for our React-based frontends

## 3.0.0 (2023-09-30)

### Changed

 - All FreeSewing packages are now ESM only.
 - All FreeSewing packages now use named exports.
 - Dropped support for NodeJS 14. NodeJS 18 (LTS/hydrogen) or more recent is now required.


This is the **initial release**, and the start of this change log.

> Prior to version 2, FreeSewing was not a JavaScript project.
> As such, that history is out of scope for this change log.

