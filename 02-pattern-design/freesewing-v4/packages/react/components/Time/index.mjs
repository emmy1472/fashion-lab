import React from 'react'
import { DateTime, Interval } from 'luxon'

const day = 86400000
const hour = 3600000
const minute = 60000
const second = 1000

/**
 * A component to render date + time
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.iso - Time in ISO format
 * @returns {JSX.Element}
 */
export const DateAndTime = ({ iso }) => {
  const dt = DateTime.fromISO(iso)
  return dt.toLocaleString(DateTime.DATETIME_MED)
}

const TimeForHumans = ({ iso, future = false }) => {
  const suffix = future ? 'from now' : 'ago'
  const dates = [DateTime.fromISO(iso), DateTime.now()]
  if (future) dates.reverse()
  const i = Interval.fromDateTimes(...dates)
    .toDuration(['minutes', 'hours', 'days', 'months', 'years'])
    .toObject()
  const years = Math.floor(i.years)
  const months = Math.floor(i.months)
  const days = Math.floor(i.days)
  const hours = Math.floor(i.hours)
  const minutes = Math.floor(i.minutes)
  if (years < 1 && months < 1 && days < 1 && hours < 1 && minutes < 1) return `seconds ${suffix}`
  else if (years < 1 && months < 1 && days < 1 && hours < 1)
    return minutes < 2 ? `one minute ${suffix}` : `${minutes} minutes ${suffix}`
  else if (i.years < 1 && i.months < 1 && i.days < 1)
    return hours < 2 ? `${hours * 60 + minutes} minutes ${suffix}` : `${hours} hours ${suffix}`
  else if (years < 1 && months < 1)
    return days < 2 ? `${days * 24 + hours} hours ${suffix}` : `${days} days ${suffix}`
  else if (years < 1)
    return months < 4 ? `${months} months and ${days} days ${suffix}` : `${months} months ${suffix}`
  if (years < 3) return `${years * 12 + i.months} months ${suffix}`
  return `${years} years ${suffix}`
}

/**
 * A component to render the time delta between now and a moment in the past.
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.iso - Time in ISO format
 * @returns {JSX.Element}
 */
export const TimeAgo = (props) => <TimeForHumans {...props} future={false} />

/**
 * A component to render the time delta between now and a moment in the future.
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.iso - Time in ISO format
 * @returns {JSX.Element}
 */
export const TimeToGo = (props) => <TimeForHumans {...props} future={true} />

/**
 * A component to render the time delta between now and a moment in the past.
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.time - Timestamp in milliseconds
 * @returns {JSX.Element}
 */
export const TimeAgoBrief = ({ time }) => {
  const d = Math.floor(Date.now() - Number(time))
  if (d > day) return `${Math.floor(d / day)}d ago`
  if (d > hour) return `${Math.floor(d / hour)}h ago`
  if (d > minute * 2) return `${Math.floor(d / minute)}m ago`
  if (d > second) return `${Math.floor(d / second)}s  ago`
  return `${d}ms ago`
}

/**
 * A component to render the time delta between now and a moment in the future.
 *
 * @component
 * @param {object} props - All component props
 * @param {string} props.time - Timestamp in milliseconds
 * @returns {JSX.Element}
 */
export const TimeToGoBrief = ({ time }) => {
  const d = Math.floor(Number(time) - Date.now())
  if (d > day) return `${Math.floor(d / day)}d`
  if (d > hour) return `${Math.floor(d / hour)}h`
  if (d > minute * 2) return `${Math.floor(d / minute)}m`
  if (d > second) return `${Math.floor(d / second)}s`
  return `${d}s`
}
