import React from 'react'
import Markdown from 'react-markdown'

export const LogEntry = ({ logEntry }) => (
  <>
    <div className="log-entry tw:mb-2">
      <Markdown>{Array.isArray(logEntry) ? logEntry[0] : logEntry}</Markdown>
    </div>
    {/* uncomment to enable stacktrace view
     Array.isArray(logEntry) && logEntry[1].stack ? (
      <Highlight title="Stacktrace" raw={logEntry[1]?.stack} />
    ) : null */}
  </>
)
