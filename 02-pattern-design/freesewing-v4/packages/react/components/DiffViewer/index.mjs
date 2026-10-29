import React from 'react'
import { diffWords, diffJson } from 'diff'
import ReactDiffViewer from 'react-diff-viewer-continued'

/**
 * A method to diff JSON content
 *
 * @public
 * @param {object} from - Once side of the diff
 * @param {object} to - Other side of the diff
 * @returns {object}
 */
export const diffJSON = (from, to) => diffJson(from, to)

/**
 * A method to diff string content
 *
 * @public
 * @param {string} from - Once side of the diff
 * @param {string} to - Other side of the diff
 * @returns {object}
 */
export const diffCheck = (from, to) => diffWords(from, to)

export const DiffViewer = (props) => <ReactDiffViewer {...props} />
