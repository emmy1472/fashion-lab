import React from 'react'
import {
  CoverPageIcon,
  PageMarginIcon,
  PageOrientationIcon,
  PageSizeIcon,
  PatternIcon,
  ScaleIcon,
} from '@freesewing/react/components/Icon'

const defaultPrintSettings = (units) => ({
  size: units === 'imperial' ? 'letter' : 'a4',
  orientation: 'portrait',
  margin: units === 'imperial' ? 12.7 : 10,
  coverPage: 1,
  iconSize: 0.5,
})

export function menuLayoutSettingsStructure(units) {
  const defaults = defaultPrintSettings(units)
  const sizeTitles = {
    a4: 'A4',
    a3: 'A3',
    a2: 'A2',
    a1: 'A1',
    a0: 'A0',
    letter: 'Letter',
    legal: 'Legal',
    tabloid: 'Tabloid',
    'arch d': 'ARCH D (24" x 36")',
    'arch e': 'ARCH E (36" x 48")',
  }

  return {
    size: {
      dense: true,
      title: 'Paper Size',
      about: (
        <span>
          This control the pages overlay that helps you see how your pattern spans the pages. This
          does not limit your export options, you can still export in a variety of paper sizes.
        </span>
      ),
      ux: 1,
      list: Object.keys(sizeTitles),
      choiceTitles: sizeTitles,
      valueTitles: sizeTitles,
      dflt: defaults.size,
      icon: PageSizeIcon,
    },
    orientation: {
      dense: true,
      title: 'Page Orientation',
      about: (
        <span>Landscape or Portrait. Try both to see which yields the least amount of pages.</span>
      ),
      ux: 1,
      list: ['portrait', 'landscape'],
      choiceTitles: {
        portrait: (
          <div className="tw:flex tw:flex-row tw:items-center tw:gap-4">
            <PatternIcon className="tw:h-5 tw:w-5" />
            <span className="tw:grow">Portrait (tall)</span>
          </div>
        ),
        landscape: (
          <div className="tw:flex tw:flex-row tw:items-center tw:gap-4">
            <PatternIcon className="tw:h-5 tw:w-5 tw:-rotate-90" />
            <span className="tw:grow">Landscape (wide)</span>
          </div>
        ),
      },
      icon: PageOrientationIcon,
      dflt: defaults.orientation,
    },
    margin: {
      dense: true,
      title: 'Page Margin',
      min: units === 'imperial' ? 2.5 : 5,
      max: 25,
      dflt: defaults.margin,
      icon: PageMarginIcon,
      ux: 1,
    },
    coverPage: {
      dense: true,
      ux: 1,
      icon: CoverPageIcon,
      title: 'Cover Page',
      about:
        'The cover page includes information about the pattern and an overview of how to assemble the pages.',
      list: [0, 1],
      choiceTitles: {
        0: 'Do not include a cover page',
        1: 'Include a cover page',
      },
      dflt: defaults.coverPage,
    },
    iconSize: {
      dense: true,
      ux: 1,
      icon: ScaleIcon,
      title: 'Icon Size',
      about:
        'Controls the size of the icons that allow you to rotate/flip individual pattern parts',
      min: 10,
      dflt: defaults.iconSize,
      step: 1,
      max: 200,
    },
  }
}
