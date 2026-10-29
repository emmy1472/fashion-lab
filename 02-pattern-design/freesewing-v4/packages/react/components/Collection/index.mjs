// Dependencies
import {
  about,
  collection,
  tags,
  techniques,
  examples,
  requiredMeasurements,
  optionalMeasurements,
} from '@freesewing/collection'
import { capitalize, linkClasses, mutateObject } from '@freesewing/utils'
import { measurements as measurementsTranslations } from '@freesewing/i18n'
// Hooks
import React, { useState, Fragment } from 'react'
import { useFilter } from '@freesewing/react/hooks/useFilter'
// Components
import { Link as WebLink } from '@freesewing/react/components/Link'
import {
  CircleIcon,
  CisFemaleIcon,
  DocsIcon,
  FilterIcon,
  NewPatternIcon,
  ResetIcon,
  ShowcaseIcon,
} from '@freesewing/react/components/Icon'
import {
  lineDrawingsFront as lineDrawings,
  lineDrawingsBack,
} from '@freesewing/react/components/LineDrawing'
import { IconButton } from '@freesewing/react/components/Button'
import { KeyVal } from '@freesewing/react/components/KeyVal'
import { MissingLinedrawing } from '../LineDrawing/missing.mjs'

/**
 * A component to show the FreeSewing collection and pick a design.
 *
 * @component
 * @param {object} props - All component props
 * @param {React.Component} [props.Link = false] - A framework specific Link component for client-side routing
 * @param {boolean} [props.editor = false] - Set this to true when rendering inside the FreeSewing editor
 * @param {string} [props.linkTo = 'about'] - This controls where to link the design to. One of 'new', 'docs', or 'about'.
 * @param {functino} [props.onClick = false] - You can pass in an onClick handler rather than using links
 * @returns {JSX.Element}
 */
export const Collection = ({ Link = false, linkTo = 'about', editor = false, onClick = false }) => {
  if (!Link) Link = WebLink

  // State
  const [filter, setFilter] = useFilter()
  const [showFilters, setShowFilters] = useState(false)

  /*
   * Apply filter
   */
  const filtered = {}
  for (const d of collection) {
    let skip = false
    if (
      filter.tag &&
      filter.tag.filter((tag) => about[d].tags.includes(tag)).length < filter.tag.length
    )
      skip = true
    if (
      filter.tech &&
      filter.tech.filter((tech) => about[d].techniques.includes(tech)).length < filter.tech.length
    )
      skip = true
    if (filter.difficulty && filter.difficulty !== about[d].difficulty) skip = true
    if (!skip) filtered[d] = d
  }

  const updateFilter = (path, val) => {
    // Allow clicking the same difficulty to remove it as a filter
    if (path === 'difficulty' && val === filter.difficulty) val = 'unset'
    const newFilter = mutateObject({ ...filter }, path, val)
    setFilter(newFilter)
  }

  const toggle = (type, val) => {
    const current = filter[type] || []
    const newSet = new Set(current)
    if (newSet.has(val)) newSet.delete(val)
    else newSet.add(val)
    updateFilter(type, [...newSet])
  }

  return (
    <>
      <div className="tw:max-w-7xl tw:m-auto" data-component="Collection/Collection">
        <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-1 tw:justify-center tw:font-medium tw:mb-2">
          {Object.keys(filtered)
            .sort()
            .map((d) =>
              onClick ? (
                <button
                  key={d}
                  onClick={() => onClick(d)}
                  className="tw:text-secondary tw:decoration-2 tw:underline tw:capitalize tw:hover:decoration-4 tw:hover:text-secondary tw:bg-transparent tw:border-0 tw:font-medium tw:p-0 tw:text-base tw:hover:cursor-pointer"
                >
                  {d}
                </button>
              ) : (
                <Link
                  key={d}
                  href={linkBuilders[linkTo](d)}
                  className="tw:text-secondary tw:decoration-2 tw:underline tw:capitalize tw:hover:decoration-4 tw:hover:text-secondary"
                >
                  {d}
                </Link>
              )
            )}
        </div>
        {showFilters ? (
          <>
            <h6 className="tw:text-center tw:mb-0 tw:mt-4">
              Filtered Designs ({Object.keys(filtered).length}/{collection.length})
            </h6>
            <div className="tw:flex tw:flex-row tw:gap-1 tw:items-center tw:justify-center tw:flex-wrap tw:my-2">
              <b>Tags:</b>
              {tags.map((tag) => (
                <button
                  key={tag}
                  className={`tw:daisy-badge tw:font-medium tw:hover:shadow tw:hover:cursor-pointer
                  ${
                    filter?.tag && Array.isArray(filter.tag) && filter.tag.includes(tag)
                      ? 'tw:daisy-badge-success hover:tw:daisy-badge-error'
                      : 'tw:daisy-badge-primary hover:tw:daisy-badge-success'
                  }`}
                  onClick={() => toggle('tag', tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="tw:flex tw:flex-row tw:gap-1 tw:items-center tw:justify-center tw:flex-wrap tw:my-4">
              <b>Techniques</b>
              {techniques.sort().map((tech) => (
                <button
                  key={tech}
                  className={`tw:daisy-badge tw:font-medium tw:hover:shadow
                 ${
                   filter?.tech && Array.isArray(filter.tech) && filter.tech.includes(tech)
                     ? 'tw:daisy-badge tw:daisy-badge-success hover:tw:daisy-badge-error'
                     : 'tw:daisy-badge tw:daisy-badge-accent hover:tw:daisy-badge-success'
                 }`}
                  onClick={() => toggle('tech', tech)}
                >
                  {tech}
                </button>
              ))}
            </div>
            <div className="tw:flex tw:flex-row tw:gap-2 tw:items-center tw:justify-center tw:flex-wrap tw:my-4">
              <b>Difficulty:</b>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  onClick={() => updateFilter('difficulty', score)}
                  key={score}
                  className={`tw:daisy-btn tw:daisy-btn-sm ${
                    filter.difficulty === score
                      ? 'tw:daisy-btn-secondary tw:daisy-btn-outline'
                      : 'tw:daisy-btn-ghost'
                  }`}
                >
                  <Difficulty score={score} />
                </button>
              ))}
            </div>
            <div className="tw:flex tw:flex-row tw:gap-4 tw:items-center tw:justify-center tw:flex-wrap tw:my-2">
              <button
                className="tw:daisy-btn tw:daisy-btn-secondary tw:daisy-btn-outline"
                onClick={() => updateFilter('ld', !filter.ld)}
              >
                {filter.ld ? <CisFemaleIcon /> : <ShowcaseIcon />}
                {filter.ld ? 'Show Examples' : 'Show Line Drawings'}
              </button>
              <button
                className="tw:daisy-btn tw:daisy-btn-secondary tw:daisy-btn-outline"
                onClick={() => setFilter({ ld: 1 })}
              >
                <ResetIcon />
                Clear Filters
              </button>
              <button
                className="tw:daisy-btn tw:daisy-btn-secondary tw:daisy-btn-outline"
                onClick={() => setShowFilters(false)}
              >
                <FilterIcon />
                Hide Filters
              </button>
            </div>
          </>
        ) : (
          <div className="tw:flex tw:flex-row tw:gap-4 tw:items-center tw:justify-center tw:flex-wrap tw:my-2">
            <button
              className="tw:daisy-btn tw:daisy-btn-secondary tw:daisy-btn-outline"
              onClick={() => updateFilter('ld', !filter.ld)}
            >
              {filter.ld ? <ShowcaseIcon /> : <CisFemaleIcon />}
              {filter.ld ? 'Show Examples' : 'Show Line Drawings'}
            </button>
            <button
              className="tw:daisy-btn tw:daisy-btn-secondary tw:daisy-btn-outline"
              onClick={() => setShowFilters(true)}
            >
              <FilterIcon />
              Show Filters
            </button>
          </div>
        )}
      </div>
      <div
        className={`tw:grid tw:grid-cols-2 tw:gap-2 tw:mt-4 tw:justify-center tw:sm:grid-cols-3 tw:md:grid-cols-4 ${editor ? 'tw:lg:grid-cols-6 tw:2xl:grid-cols-12' : ''} tw:mb-8`}
      >
        {Object.keys(filtered)
          .sort()
          .map((d) => (
            <DesignCard
              name={d}
              key={d}
              linkTo={linkTo}
              onClick={onClick}
              lineDrawing={filter.ld ? true : false}
            />
          ))}
      </div>
    </>
  )
}

const DesignCard = ({ name, lineDrawing = false, linkTo, Link, onClick }) => {
  if (!Link) Link = WebLink

  const LineDrawing = lineDrawing && lineDrawings[name] ? lineDrawings[name] : MissingLinedrawing
  const exampleImageUrl = examples.href[name] ? examples.href[name] : noExample
  const bg = { aspectRatio: '1/1.4' }
  if (!lineDrawing) {
    bg.backgroundImage = `url(${exampleImageUrl})`
    bg.backgroundSize = 'cover'
    bg.backgroundPosition = 'center center'
  }

  const inner = (
    <div
      className={`tw:flex tw:flex-col tw:flex-nowrap tw:justify-between tw:gap-2 tw:border-neutral-500 tw:group-hover:border-secondary
      tw:w-full tw:h-full tw:border tw:border-2 tw:border-solid tw:p-0 tw:relative tw:rounded-lg`}
      style={bg}
    >
      <h5
        className={`tw:text-center tw:py-2 tw:px-4 tw:rounded-t tw:m-0 tw:group-hover:no-underline tw:group-hover:bg-secondary/80 tw:group-hover:text-secondary-content
      ${lineDrawing ? '' : 'tw:bg-neutral/80'}`}
      >
        <span className={lineDrawing ? 'tw:text-base-100-content' : 'tw:text-neutral-content'}>
          {about[name].name}
        </span>
      </h5>
      {lineDrawing ? (
        <div className="tw:flex-auto tw:flex tw:justify-center">
          <LineDrawing className="tw:w-5/6 tw:text-base-content" />
        </div>
      ) : (
        <span />
      )}
      <div
        className={`tw:flex tw:flex-row tw:items-center tw:justify-center tw:py-1 tw:px-2 tw:rounded-b tw:m-0
      ${lineDrawing ? '' : `tw:text-neutral-content`}`}
      >
        <Difficulty score={about[name].difficulty} className="tw:group-hover:text-secondary" />
      </div>
    </div>
  )

  return onClick ? (
    <button
      onClick={() => onClick(name)}
      className="tw:hover:bg-secondary/10 tw:rounded-lg tw:group tw:hover:no-underline tw:bg-transparent tw:border-0 tw:hover:cursor-pointer tw:p-0"
      title={about[name].description}
      data-component="Collection/DesignCard"
    >
      {inner}
    </button>
  ) : (
    <Link
      href={linkBuilders[linkTo](name)}
      className="tw:hover:bg-secondary/10 tw:rounded-lg tw:group tw:hover:no-underline"
      title={about[name].description}
      data-component="Collection/DesignCard"
    >
      {inner}
    </Link>
  )
}

/*
 * A helper component to show difficulety of a design
 *
 * @param {object} props - All React props
 * @param {number} props.score - The difficulty score of the design (1-5)
 */
const Difficulty = ({ score = 0, className = '' }) => (
  <div className={`tw:flex tw:flex-row tw:items-center ${className}`}>
    {[0, 1, 2, 3, 4].map((i) => (
      <CircleIcon key={i} fill={i < score ? true : false} className={`tw:w-4 tw:h-4`} />
    ))}
  </div>
)

const linkBuilders = {
  new: (design) =>
    `/editor/#s={%22design%22%3A%22${design.toLowerCase()}%22%2C%22view%22%3A%22draft%22}`,
  docs: (design) => `/docs/designs/${design.toLowerCase()}/`,
  about: (design) => `/designs/${design.toLowerCase()}/`,
}

const noExample =
  'https://imagedelivery.net/ouSuR9yY1bHt-fuAokSA5Q/a03ec4da-d29f-4dd6-1931-60aad603a800/public'

/**
 * A component to show info about a FreeSewing design
 *
 * @component
 * @param {object} props - All component props
 * @param {React.Component} props.Link - A framework specific Link component for client-side routing
 * @param {string} props.design - The name/id of the design
 * @param {boolean} props.noDocsLink - Set this to true to not render a link to the documentation
 * @returns {JSX.Element}
 */
export const DesignInfo = ({ Link = false, design = false, noDocsLink = false }) => {
  if (!Link) Link = WebLink

  // State
  const [back, setBack] = useState(false)

  if (!design) return null

  // Line drawings
  const LineDrawing = lineDrawings[design] || MissingLinedrawing
  const LineDrawingBack = lineDrawingsBack[design] || null

  // Make sure these always hold arrays, that way we can just map() over them in the JSX output
  const codeBy = Array.isArray(about[design].code) ? about[design].code : [about[design].code]
  const designBy = Array.isArray(about[design].design)
    ? about[design].design
    : [about[design].design]
  const tags = about[design].tags || []
  const techniques = about[design].techniques || []

  const makeButton = (
    <div className={`tw:grid tw:grid-cols-1 tw:gap-2 tw:mb-4`}>
      <IconButton href={`/editor/#s={"design"%3A"${design}"%2C"view"%3A"draft"}`} color="primary">
        <NewPatternIcon className="tw:w-8 tw:h-8" />
        New {capitalize(design)} pattern
      </IconButton>
    </div>
  )
  const buttons = noDocsLink ? (
    makeButton
  ) : (
    <div className={`tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-2 tw:mb-4`}>
      <IconButton href={`/docs/designs/${design}`} color="secondary">
        <DocsIcon className="tw:w-8 tw:h-8" />
        Documentation
      </IconButton>
      {makeButton}
    </div>
  )

  return (
    <>
      <div className="tw:lg:hidden">{buttons}</div>
      <div className={`tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-2`}>
        <div className="tw:relative">
          <div className="tw tw:top-0 tw:left-0">
            {back ? <LineDrawingBack /> : <LineDrawing />}
          </div>
          {LineDrawingBack ? (
            <button
              className="tw:absolute tw:top-2 tw:right-4 tw:start-auto tw:daisy-btn tw:daisy-btn-neutral tw:daisy-btn-outline tw:daisy-btn-xs"
              onClick={() => setBack(!back)}
            >
              {back ? 'Front' : 'Back'} view
            </button>
          ) : null}
        </div>
        <div className="">
          <div className="tw:mt-2 tw:text-sm tw:opacity-70 tw:font-medium">Description</div>
          <span className="tw:text-xl">{about[design].description}</span>

          <div className="tw:mt-2 tw:text-sm tw:opacity-70 tw:font-medium">By</div>
          <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-1 items-center">
            {codeBy.map((code) => (
              <KeyVal key={code} k="code" val={code} color="secondary" />
            ))}
            {designBy.map((code) => (
              <KeyVal key={code} k="design" val={code} color="secondary" />
            ))}
          </div>

          <div className="tw:mt-2 tw:text-sm tw:opacity-70 tw:font-medium">Difficulty</div>
          <Difficulty score={about[design].difficulty} />

          {optionalMeasurements[design].length > 0 ? (
            <>
              <div className="tw:mt-2 tw:text-sm tw:opacity-70 tw:font-medium">
                Optional Measurements
              </div>
              <div className="">
                {optionalMeasurements[design].map((m, i) => (
                  <Fragment key={m}>
                    <Link
                      href={`/docs/measurements/${m.toLowerCase()}`}
                      key={m}
                      className={linkClasses}
                    >
                      {measurementsTranslations[m]}
                    </Link>
                    {i < optionalMeasurements[design].length - 1 ? <span>, </span> : null}
                  </Fragment>
                ))}
              </div>
            </>
          ) : null}

          {requiredMeasurements[design].length > 0 ? (
            <>
              <div className="tw:mt-2 tw:text-sm tw:opacity-70 tw:font-medium">
                Required Measurements
              </div>
              <div className="">
                {requiredMeasurements[design].map((m, i) => (
                  <Fragment key={m}>
                    <Link
                      href={`/docs/measurements/${m.toLowerCase()}`}
                      key={m}
                      className={linkClasses}
                    >
                      {measurementsTranslations[m]}
                    </Link>
                    {i < requiredMeasurements[design].length - 1 ? <span>, </span> : null}
                  </Fragment>
                ))}
              </div>
            </>
          ) : null}

          <div className="tw:mt-2 tw:text-sm tw:opacity-70 tw:font-medium">Tags</div>
          <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-1 items-center">
            {tags.map((tag) => (
              <Link
                key={tag}
                className="tw:daisy-badge tw:daisy-badge-primary tw:font-medium tw:hover:shadow tw:hover:cursor-pointer"
                href={`/designs/#filter={"example"%3Atrue%2C"tag"%3A["${tag}"]}`}
              >
                <span className="tw:text-primary-content">{tag}</span>
              </Link>
            ))}
          </div>
          <div className="tw:mt-2 tw:text-sm tw:opacity-70 tw:font-medium">Techniques</div>
          <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-1 items-center">
            {techniques.map((tech) => (
              <Link
                key={tech}
                className="tw:daisy-badge tw:daisy-badge-accent tw:font-medium tw:hover:shadow tw:hover:cursor-pointer"
                href={`/designs/#filter={"example"%3Atrue%2C"tech"%3A["${tech}"]}`}
              >
                <span className="tw:text-accent-content">{tech}</span>
              </Link>
            ))}
          </div>

          <div className="tw:mt-2 tw:text-sm tw:opacity-70 tw:font-medium">Examples</div>
          <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-1 items-center">
            <KeyVal
              k="FreeSewing"
              val="showcase"
              color="secondary"
              href={`/showcase/tags/${design}`}
              Link={Link}
            />
            <KeyVal
              k="Instagram"
              val={`#FreeSewing${capitalize(design)}`}
              color="secondary"
              href={`https://www.instagram.com/explore/search/keyword/?q=%23FreeSewing${capitalize(design)}`}
            />
          </div>

          <div className="tw:mt-2 tw:text-sm tw:opacity-70 tw:font-medium">Documentation</div>
          <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-1 items-center">
            <Link href={`/docs/designs/${design}/#notes`}>Designer Notes</Link>,
            <Link href={`/docs/designs/${design}/#needs`}>What You Need</Link>,
            <Link href={`/docs/designs/${design}/#fabric`}>Fabric Options</Link>,
            <Link href={`/docs/designs/${design}/#cutting`}>Cutting Instructions</Link>,
            <Link href={`/docs/designs/${design}/options/`}>Design Options</Link>,
            <Link href={`/docs/designs/${design}/instructions/`}>Sewing Instructions</Link>
          </div>
          <div className="tw:my-4">{buttons}</div>
        </div>
      </div>
    </>
  )
}
