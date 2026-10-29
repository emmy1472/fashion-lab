import React from 'react'
import { DateAndTime, TimeAgo, TimeToGo, TimeAgoBrief, TimeToGoBrief } from '@freesewing/react/components/Time'

export const DateAndTimeExample = () => <DateAndTime iso="2025-05-29T12:34:00.000Z" />
export const TimeAgoExample = () => <TimeAgo iso="2025-05-21T12:34:00.000Z" />
export const TimeToGoExample = () => <TimeToGo iso="2035-05-29T12:34:00.000Z" />
export const TimeAgoBriefExample = () => <TimeAgoBrief   time={1748000000000} />
export const TimeToGoBriefExample = () => <TimeToGoBrief time={1900000000000} />

