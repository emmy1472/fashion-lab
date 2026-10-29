import React from 'react'

// See: /docs/editor/views/draft
export const PatternDiagram = () => (
  <svg viewBox="0 0 700 280" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
      </marker>
    </defs>
    <path
      d="M 120,50 L 265,50"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      markerEnd="url(#arrowhead)"
    />
    <path
      d="M 350,75 L 350,125"
      stroke="currentColor"
      strokeWidth="2"
      markerEnd="url(#arrowhead)"
    />
    <path
      d="M 530,50 L 435, 50"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      markerEnd="url(#arrowhead)"
    />
    <path
      d="M 350,175 L 350,225"
      stroke="currentColor"
      strokeWidth="2"
      markerEnd="url(#arrowhead)"
    />
    <SvgBox x={120} y={50} color="user" text="User Measurements" view="measurements" />
    <SvgBox x={350} y={50} color="design" text="FreeSewing Design" view="designs" />
    <SvgBox x={580} y={50} color="user" text="User Preferences" view="draft" />
    <SvgBox x={350} y={150} color="core" text="FreeSewing Core" />
    <SvgBox x={350} y={250} color="pattern" text="Bespoke Pattern" />
  </svg>
)
const colors = {
  user: {
    stroke: '#fb64b6',
    fill: '#fccee8',
  },
  pattern: {
    stroke: '#a684ff',
    fill: '#ddd6ff',
  },
  core: {
    stroke: '#525252',
    fill: '#a1a1a1',
  },
  design: {
    stroke: '#00d5be',
    fill: '#96f7e4',
  },
}

const SvgBox = ({ x, y, color, text, view = false }) => (
  <>
    <rect
      x={x - 85}
      y={y - 25}
      width="170"
      height="50"
      rx="10"
      className=""
      {...colors[color]}
      strokeWidth="2"
    />
    <text
      x={x}
      y={view ? y : y + 5}
      className=""
      textAnchor="middle"
      style={{ fontWeight: 'bold' }}
    >
      {text}
    </text>
    {view ? (
      <text x={x} y={y + 16} className="" textAnchor="middle" style={{ fontSize: 'small' }}>
        <tspan>[view = </tspan>
        <tspan style={{ fontWeight: 'bold' }}>{view}</tspan>
        <tspan>]</tspan>
      </text>
    ) : null}
  </>
)
