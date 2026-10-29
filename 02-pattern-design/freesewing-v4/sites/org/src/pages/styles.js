import Layout from '@theme/Layout'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

// Re-use this
const p = (
  <p>
    This paragraph is here to show the vertical spacing between headings and paragraphs. In
    addition, let&apos;s make it a bit longer so we can see the line height as the text wraps.
  </p>
)

const namedColors = [
  'base-100',
  'base-200',
  'base-300',
  'primary',
  'secondary',
  'neutral',
  'accent',
  'success',
  'info',
  'warning',
  'error',
]

const StylesPage = ({ page }) => {
  return (
    <Layout
      title={`FreeSewing documentation for developers and contributors`}
      description="FreeSewing is an open source Javascript library for parametric sewing patterns"
    >
      <div className="tailwind-container">
        <div className="tw:text-base-content mdx tw:max-w-prose tw:text-base-content tw:max-w-prose tw:text-current tw:xl:pl-4 tw:mx-auto tw:my-8">
          <h1>Styles</h1>
          <p>This styles page shows an overview of different elements and how they are styled.</p>
          <p>
            It&apos;s a good starting point for theme development. It is also a good resource for
            debugging styling issues.
          </p>
          <h2>Headings (this is h2)</h2>
          {p} {p}
          <h3>This is h3</h3>
          {p} {p}
          <h4>This is h4</h4>
          {p} {p}
          <h5>This is h5</h5>
          {p} {p}
          <h6>This is h6</h6>
          {p} {p}
          <h2>Links and buttons</h2>
          <p className="markdown">
            A regular link <a href="#">looks like this</a>, whereas buttons look like this:
          </p>
          <h3>Main button styles</h3>
          <div className="tw:flex tw:flex-row tw:gap-2 tw:flex-wrap">
            <button className="tw:daisy-btn tw:daisy-btn-neutral">Neutral button</button>
            <button className="tw:daisy-btn tw:daisy-btn-primary">Primary button</button>
            <button className="tw:daisy-btn tw:daisy-btn-secondary">Secondary button</button>
            <button className="tw:daisy-btn tw:daisy-btn-accent">Accent button</button>
          </div>
          <h3>State button styles</h3>
          <div className="tw:flex tw:flex-row tw:gap-2 tw:flex-wrap">
            <button className="tw:daisy-btn tw:daisy-btn-info">Info button</button>
            <button className="tw:daisy-btn tw:daisy-btn-success">Success button</button>
            <button className="tw:daisy-btn tw:daisy-btn-warning">Warning button</button>
            <button className="tw:daisy-btn tw:daisy-btn-error">Error button</button>
          </div>
          <h3>Other button styles</h3>
          <div className="tw:flex tw:flex-row tw:gap-2 tw:flex-wrap">
            <button className="tw:daisy-btn tw:daisy-btn-ghost">Ghost button</button>
            <button className="tw:daisy-btn tw:daisy-btn-link">Link button</button>
          </div>
          <h3>Outlined button styles</h3>
          <div className="tw:flex tw:flex-row tw:gap-2 tw:flex-wrap">
            <button className="tw:daisy-btn tw:daisy-btn-outline tw:daisy-btn-neutral">
              Neutral button
            </button>
            <button className="tw:daisy-btn tw:daisy-btn-outline tw:daisy-btn-primary">
              Primary button
            </button>
            <button className="tw:daisy-btn tw:daisy-btn-outline tw:daisy-btn-secondary">
              Secondary button
            </button>
            <button className="tw:daisy-btn tw:daisy-btn-outline tw:daisy-btn-accent">
              Accent button
            </button>
          </div>
          <h3>Button sizes</h3>
          <div className="tw:flex tw:flex-row tw:gap-2 tw:flex-wrap">
            <button className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-lg">Large</button>
            <button className="tw:daisy-btn tw:daisy-btn-primary">Normal</button>
            <button className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-sm">Small</button>
            <button className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-xs">Tiny</button>
            <button className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-lg tw:daisy-btn-wide">
              Large wide
            </button>
            <button className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-wide">
              Normal wide
            </button>
            <button className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-sm tw:daisy-btn-wide">
              Small wide
            </button>
            <button className="tw:daisy-btn tw:daisy-btn-primary tw:daisy-btn-xs tw:daisy-bnt-wide">
              Tiny wide
            </button>
          </div>
          <h2>Named colors</h2>
          <ul className="tw:list tw:list-inside tw:list-disc tw:ml-2">
            <li className="tw:text-base-100">tw:base-100</li>
            <li className="tw:text-base-200">tw:base-200</li>
            <li className="tw:text-base-300">tw:base-300</li>
            <li className="tw:text-primary">tw:primary</li>
            <li className="tw:text-secondary">tw:secondary</li>
            <li className="tw:text-neutral">tw:neutral</li>
            <li className="tw:text-accent">tw:accent</li>
            <li className="tw:text-success">tw:success</li>
            <li className="tw:text-info">tw:info</li>
            <li className="tw:text-warning">tw:warning</li>
            <li className="tw:text-error">tw:error</li>
            <li className="tw:text-base-100-content tw:bg-base-100">
              tw:text-base-100-content tw:bg-base-100
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200">
              tw:text-base-200-content tw:bg-base-200
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300">
              tw:text-base-300-content tw:bg-base-300
            </li>
            <li className="tw:text-primary-content tw:bg-primary">
              tw:text-primary-content tw:bg-primary
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary">
              tw:text-secondary-content tw:bg-secondary
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral">
              tw:text-neutral-content tw:bg-neutral
            </li>
            <li className="tw:text-accent-content tw:bg-accent">
              tw:text-accent-content tw:bg-accent
            </li>
            <li className="tw:text-success-content tw:bg-success">
              tw:text-success-content tw:bg-success
            </li>
            <li className="tw:text-info-content tw:bg-info">tw:text-info-content tw:bg-info</li>
            <li className="tw:text-warning-content tw:bg-warning">
              tw:text-warning-content tw:bg-warning
            </li>
            <li className="tw:text-error-content tw:bg-error">tw:text-error-content tw:bg-error</li>
            <li className="tw:text-base-100-content tw:bg-base-100/90">
              tw:text-base-100-content tw:bg-base-100/90
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200/90">
              tw:text-base-200-content tw:bg-base-200/90
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300/90">
              tw:text-base-300-content tw:bg-base-300/90
            </li>
            <li className="tw:text-primary-content tw:bg-primary/90">
              tw:text-primary-content tw:bg-primary/90
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary/90">
              tw:text-secondary-content tw:bg-secondary/90
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral/90">
              tw:text-neutral-content tw:bg-neutral/90
            </li>
            <li className="tw:text-accent-content tw:bg-accent/90">
              tw:text-accent-content tw:bg-accent/90
            </li>
            <li className="tw:text-success-content tw:bg-success/90">
              tw:text-success-content tw:bg-success/90
            </li>
            <li className="tw:text-info-content tw:bg-info/90">
              tw:text-info-content tw:bg-info/90
            </li>
            <li className="tw:text-warning-content tw:bg-warning/90">
              tw:text-warning-content tw:bg-warning/90
            </li>
            <li className="tw:text-error-content tw:bg-error/90">
              tw:text-error-content tw:bg-error/90
            </li>
            <li className="tw:text-base-100-content tw:bg-base-100/80">
              tw:text-base-100-content tw:bg-base-100/80
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200/80">
              tw:text-base-200-content tw:bg-base-200/80
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300/80">
              tw:text-base-300-content tw:bg-base-300/80
            </li>
            <li className="tw:text-primary-content tw:bg-primary/80">
              tw:text-primary-content tw:bg-primary/80
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary/80">
              tw:text-secondary-content tw:bg-secondary/80
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral/80">
              tw:text-neutral-content tw:bg-neutral/80
            </li>
            <li className="tw:text-accent-content tw:bg-accent/80">
              tw:text-accent-content tw:bg-accent/80
            </li>
            <li className="tw:text-success-content tw:bg-success/80">
              tw:text-success-content tw:bg-success/80
            </li>
            <li className="tw:text-info-content tw:bg-info/80">
              tw:text-info-content tw:bg-info/80
            </li>
            <li className="tw:text-warning-content tw:bg-warning/80">
              tw:text-warning-content tw:bg-warning/80
            </li>
            <li className="tw:text-error-content tw:bg-error/80">
              tw:text-error-content tw:bg-error/80
            </li>
            <li className="tw:text-base-100-content tw:bg-base-100/70">
              tw:text-base-100-content tw:bg-base-100/70
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200/70">
              tw:text-base-200-content tw:bg-base-200/70
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300/70">
              tw:text-base-300-content tw:bg-base-300/70
            </li>
            <li className="tw:text-primary-content tw:bg-primary/70">
              tw:text-primary-content tw:bg-primary/70
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary/70">
              tw:text-secondary-content tw:bg-secondary/70
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral/70">
              tw:text-neutral-content tw:bg-neutral/70
            </li>
            <li className="tw:text-accent-content tw:bg-accent/70">
              tw:text-accent-content tw:bg-accent/70
            </li>
            <li className="tw:text-success-content tw:bg-success/70">
              tw:text-success-content tw:bg-success/70
            </li>
            <li className="tw:text-info-content tw:bg-info/70">
              tw:text-info-content tw:bg-info/70
            </li>
            <li className="tw:text-warning-content tw:bg-warning/70">
              tw:text-warning-content tw:bg-warning/70
            </li>
            <li className="tw:text-error-content tw:bg-error/70">
              tw:text-error-content tw:bg-error/70
            </li>
            <li className="tw:text-base-100-content tw:bg-base-100/60">
              tw:text-base-100-content tw:bg-base-100/60
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200/60">
              tw:text-base-200-content tw:bg-base-200/60
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300/60">
              tw:text-base-300-content tw:bg-base-300/60
            </li>
            <li className="tw:text-primary-content tw:bg-primary/60">
              tw:text-primary-content tw:bg-primary/60
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary/60">
              tw:text-secondary-content tw:bg-secondary/60
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral/60">
              tw:text-neutral-content tw:bg-neutral/60
            </li>
            <li className="tw:text-accent-content tw:bg-accent/60">
              tw:text-accent-content tw:bg-accent/60
            </li>
            <li className="tw:text-success-content tw:bg-success/60">
              tw:text-success-content tw:bg-success/60
            </li>
            <li className="tw:text-info-content tw:bg-info/60">
              tw:text-info-content tw:bg-info/60
            </li>
            <li className="tw:text-warning-content tw:bg-warning/60">
              tw:text-warning-content tw:bg-warning/60
            </li>
            <li className="tw:text-error-content tw:bg-error/60">
              tw:text-error-content tw:bg-error/60
            </li>
            <li className="tw:text-base-100-content tw:bg-base-100/50">
              tw:text-base-100-content tw:bg-base-100/50
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200/50">
              tw:text-base-200-content tw:bg-base-200/50
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300/50">
              tw:text-base-300-content tw:bg-base-300/50
            </li>
            <li className="tw:text-primary-content tw:bg-primary/50">
              tw:text-primary-content tw:bg-primary/50
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary/50">
              tw:text-secondary-content tw:bg-secondary/50
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral/50">
              tw:text-neutral-content tw:bg-neutral/50
            </li>
            <li className="tw:text-accent-content tw:bg-accent/50">
              tw:text-accent-content tw:bg-accent/50
            </li>
            <li className="tw:text-success-content tw:bg-success/50">
              tw:text-success-content tw:bg-success/50
            </li>
            <li className="tw:text-info-content tw:bg-info/50">
              tw:text-info-content tw:bg-info/50
            </li>
            <li className="tw:text-warning-content tw:bg-warning/50">
              tw:text-warning-content tw:bg-warning/50
            </li>
            <li className="tw:text-error-content tw:bg-error/50">
              tw:text-error-content tw:bg-error/50
            </li>
            <li className="tw:text-base-100-content tw:bg-base-100/40">
              tw:text-base-100-content tw:bg-base-100/40
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200/40">
              tw:text-base-200-content tw:bg-base-200/40
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300/40">
              tw:text-base-300-content tw:bg-base-300/40
            </li>
            <li className="tw:text-primary-content tw:bg-primary/40">
              tw:text-primary-content tw:bg-primary/40
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary/40">
              tw:text-secondary-content tw:bg-secondary/40
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral/40">
              tw:text-neutral-content tw:bg-neutral/40
            </li>
            <li className="tw:text-accent-content tw:bg-accent/40">
              tw:text-accent-content tw:bg-accent/40
            </li>
            <li className="tw:text-success-content tw:bg-success/40">
              tw:text-success-content tw:bg-success/40
            </li>
            <li className="tw:text-info-content tw:bg-info/40">
              tw:text-info-content tw:bg-info/40
            </li>
            <li className="tw:text-warning-content tw:bg-warning/40">
              tw:text-warning-content tw:bg-warning/40
            </li>
            <li className="tw:text-error-content tw:bg-error/40">
              tw:text-error-content tw:bg-error/40
            </li>
            <li className="tw:text-base-100-content tw:bg-base-100/30">
              tw:text-base-100-content tw:bg-base-100/30
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200/30">
              tw:text-base-200-content tw:bg-base-200/30
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300/30">
              tw:text-base-300-content tw:bg-base-300/30
            </li>
            <li className="tw:text-primary-content tw:bg-primary/30">
              tw:text-primary-content tw:bg-primary/30
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary/30">
              tw:text-secondary-content tw:bg-secondary/30
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral/30">
              tw:text-neutral-content tw:bg-neutral/30
            </li>
            <li className="tw:text-accent-content tw:bg-accent/30">
              tw:text-accent-content tw:bg-accent/30
            </li>
            <li className="tw:text-success-content tw:bg-success/30">
              tw:text-success-content tw:bg-success/30
            </li>
            <li className="tw:text-info-content tw:bg-info/30">
              tw:text-info-content tw:bg-info/30
            </li>
            <li className="tw:text-warning-content tw:bg-warning/30">
              tw:text-warning-content tw:bg-warning/30
            </li>
            <li className="tw:text-error-content tw:bg-error/30">
              tw:text-error-content tw:bg-error/30
            </li>
            <li className="tw:text-base-100-content tw:bg-base-100/20">
              tw:text-base-100-content tw:bg-base-100/20
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200/20">
              tw:text-base-200-content tw:bg-base-200/20
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300/20">
              tw:text-base-300-content tw:bg-base-300/20
            </li>
            <li className="tw:text-primary-content tw:bg-primary/20">
              tw:text-primary-content tw:bg-primary/20
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary/20">
              tw:text-secondary-content tw:bg-secondary/20
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral/20">
              tw:text-neutral-content tw:bg-neutral/20
            </li>
            <li className="tw:text-accent-content tw:bg-accent/20">
              tw:text-accent-content tw:bg-accent/20
            </li>
            <li className="tw:text-success-content tw:bg-success/20">
              tw:text-success-content tw:bg-success/20
            </li>
            <li className="tw:text-info-content tw:bg-info/20">
              tw:text-info-content tw:bg-info/20
            </li>
            <li className="tw:text-warning-content tw:bg-warning/20">
              tw:text-warning-content tw:bg-warning/20
            </li>
            <li className="tw:text-error-content tw:bg-error/20">
              tw:text-error-content tw:bg-error/20
            </li>
            <li className="tw:text-base-100-content tw:bg-base-100/10">
              tw:text-base-100-content tw:bg-base-100/10
            </li>
            <li className="tw:text-base-200-content tw:bg-base-200/10">
              tw:text-base-200-content tw:bg-base-200/10
            </li>
            <li className="tw:text-base-300-content tw:bg-base-300/10">
              tw:text-base-300-content tw:bg-base-300/10
            </li>
            <li className="tw:text-primary-content tw:bg-primary/10">
              tw:text-primary-content tw:bg-primary/10
            </li>
            <li className="tw:text-secondary-content tw:bg-secondary/10">
              tw:text-secondary-content tw:bg-secondary/10
            </li>
            <li className="tw:text-neutral-content tw:bg-neutral/10">
              tw:text-neutral-content tw:bg-neutral/10
            </li>
            <li className="tw:text-accent-content tw:bg-accent/10">
              tw:text-accent-content tw:bg-accent/10
            </li>
            <li className="tw:text-success-content tw:bg-success/10">
              tw:text-success-content tw:bg-success/10
            </li>
            <li className="tw:text-info-content tw:bg-info/10">
              tw:text-info-content tw:bg-info/10
            </li>
            <li className="tw:text-warning-content tw:bg-warning/10">
              tw:text-warning-content tw:bg-warning/10
            </li>
            <li className="tw:text-error-content tw:bg-error/10">
              tw:text-error-content tw:bg-error/10
            </li>
          </ul>
          <h2>Tabs</h2>
          <Tabs>
            <TabItem value="1" label="Tab 1">
              <p>This is 1</p>
            </TabItem>
            <TabItem value="2" label="Tab 2">
              <p>This is 2</p>
            </TabItem>
            <TabItem value="3" label="Tab 3">
              <p>This is 3</p>
            </TabItem>
            <TabItem value="4" label="Tab 4">
              <p>This is 4</p>
            </TabItem>
          </Tabs>
        </div>
      </div>
    </Layout>
  )
}

export default StylesPage
