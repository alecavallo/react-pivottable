/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import PropTypes from 'prop-types';
import {PivotData} from './Utilities';

/**
 * Calculates how manny rows should be added to the calculated span for subtotal's parent
 * @param {Array} arr array of table rows keys
 * @param {int} pos current possition in arr
 * @param {int} col column to be compared
 * @returns {int} number of span to be added to the subtotals parent cell
 */
const calculateSutotalsParentspan = function(arr, pos, col) {
  let count = 0;

  if (!Array.isArray(arr) || col >= arr[pos].length - 1) {
    return count;
  }

  let x;
  if (pos !== 0) {
    let asc, end;
    let noDraw = true;
    for (
      x = 0, end = col, asc = end >= 0;
      asc ? x <= end : x >= end;
      asc ? x++ : x--
    ) {
      // detect when the group/subgroup has finished
      if (arr[pos - 1][x] !== arr[pos][x]) {
        noDraw = false;
      }
    }

    // if we stay in the same subgroup (or there is no grouping), don't continue processing the array
    if (noDraw) {
      return 0;
    }
  }

  // base case for the last row
  if (pos === arr.length - 1) {
    return 0;
  }

  // checking if the coordinate (row/col) analyzed indicated is within a group. If not, return 0
  if (arr[pos][col] !== arr[pos + 1][col]) {
    return 0;
  }

  // iterate over the rows to get the size of the first grouping
  let i = pos;
  let maxGroupRowIndex = arr.length - 1;

  while (i <= maxGroupRowIndex) {
    /** defining base cases*/

    // if we analyze the first row
    if (i === pos && i + 1 === maxGroupRowIndex) {
      let groupStarted = false;
      for (let j = col; j < arr[i].length - 1; j++) {
        if (arr[i][j] !== arr[i + 1][j]) {
          if (groupStarted === true) {
            count++;
          }
          break;
        } else {
          if (j > col) {
            groupStarted = true;
          }
        }
      }
      return count;
    }

    // if we analyze the penultimate row
    if (i + 1 > maxGroupRowIndex) {
      for (let j = col; j < arr[i].length - 1; j++) {
        if (arr[i][j] === arr[i - 1][j]) {
          if (j > col) {
            count++;
          }
        } else {
          break;
        }
      }
    }

    /** end of base cases */
    // all other rows
    if (i > pos && i + 1 <= maxGroupRowIndex) {
      let previousGroupFinished = false;
      for (let j = col; j < arr[i].length - 1; j++) {
        // if matches with previous row, it's a group ... allow comparison with next row
        if (arr[i - 1][j] === arr[i][j]) {
          // test if the group changes on the preceding columns until the current one
          if (!previousGroupFinished) {
            for (let pc = 0; pc < j + 1; pc++) {
              if (arr[i][pc] !== arr[i + 1][pc]) {
                previousGroupFinished = true;
                break;
              }
            }
          }

          if (previousGroupFinished === true) {
            if (j > col) {
              count++;
            }
            if (j === col) {
              maxGroupRowIndex = i;
            }
          }
        } else {
          break;
        }
      }
    }

    i++;
  }

  return count;
};

/**
 * This function is used to detect if the subtotal row should be rendered. to do that it compares i-1, i, and i+1
 * @param {Array} arr array of table rows to be analized
 * @param {int} pos table row to be analyzed
 * @param {int} col table colum used in the comparison
 * @returns {boolean} returns true if the subtotal row should be rendered after the possition indicated by pos
 */
const renderSubtotal = function(arr, pos, col) {
  let doRenderSubtotal = true;
  // basic conditions where this never will be true
  if (
    pos === 0 ||
    col === arr[pos].length - 1 ||
    !Array.isArray(arr) ||
    !Array.isArray(arr[pos]) ||
    arr.length <= 2 ||
    arr[pos].length < 2
  ) {
    return false;
  }

  // comparing the current row with the previous one in order to assure it's a grouping. All previous columns shold be equals
  for (let i = 0; i <= col; i++) {
    doRenderSubtotal &= arr[pos - 1][i] === arr[pos][i];

    if (!doRenderSubtotal) {
      break;
    }
  }

  if (!doRenderSubtotal) {
    return false;
  }
  if (pos + 1 > arr.length - 1) {
    return doRenderSubtotal;
  }

  // checking if at least one column differs with the next row
  let nextRowDifferent = false;

  for (let i = 0; i <= col; i++) {
    nextRowDifferent |= arr[pos][i] !== arr[pos + 1][i];

    if (nextRowDifferent) {
      break;
    }
  }

  return doRenderSubtotal && nextRowDifferent;
};

const calculateRowSpan = function(data, row, col) {
  return 0;
};
const calculateColSpan = function(data, row, col) {
  return 0;
};
const calcExtraSpan = function(data) {
  const metadataMatrix = new Array();
  data.forEach((row, rowKey) => {
    const cols = new Array();
    row.forEach((colValue, colKey) => {
      const cell = {
        val: colValue,
        rowSpan: 0,
        colSpan: 0,
        renderSubtotal: false,
      };
      cell.rowSpan = calculateRowSpan(data, rowKey, colKey);
      cell.colSpan = calculateColSpan(data, rowKey, colKey);
      cell.renderSubtotal = renderSubtotal(data, rowKey, colKey);
      cols[colKey] = cell;
    });
    metadataMatrix[rowKey] = cols;
  });
};

/**
 *
 * helper function for setting row/col-span in pivotTableRenderer
 * @param {Array} arr bi-dimensional array of row/cols elements
 * @param {int} i arr starting row
 * @param {int} j end offset in arr row
 * @returns {int} numbers of rows/cols to span or -1 if the span is not applicable
 */
const spanSize = function(arr, i, j) {
  let x;
  if (i !== 0) {
    let asc, end;
    let noDraw = true;
    for (
      x = 0, end = j, asc = end >= 0;
      asc ? x <= end : x >= end;
      asc ? x++ : x--
    ) {
      // detect when the group/subgroup has finished
      if (arr[i - 1][x] !== arr[i][x]) {
        noDraw = false;
      }
    }

    // if we stay in the same subgroup (or there is no grouping), don't continue processing the array
    if (noDraw) {
      return -1;
    }
  }

  let len = 0;

  while (i + len < arr.length) {
    let asc1, end1;
    let stop = false;

    for (
      x = 0, end1 = j, asc1 = end1 >= 0;
      asc1 ? x <= end1 : x >= end1;
      asc1 ? x++ : x--
    ) {
      // detect when a group has finished
      if (arr[i][x] !== arr[i + len][x]) {
        stop = true;
      }
    }
    if (stop) {
      break;
    }

    len++;
  }

  return len;
};

function redColorScaleGenerator(values) {
  const min = Math.min.apply(Math, values);
  const max = Math.max.apply(Math, values);
  return x => {
    // eslint-disable-next-line no-magic-numbers
    const nonRed = 255 - Math.round(255 * (x - min) / (max - min));
    return {backgroundColor: `rgb(255,${nonRed},${nonRed})`};
  };
}

function makeRenderer(opts = {}) {
  class Subtotal extends React.Component {
    render() {
      return this.props.rowAttrs
        .slice()
        .reverse()
        .map((txt, col) => {
          const revCol = this.props.rowAttrs.length - 1 - col;
          if (!renderSubtotal(this.props.rowKeys, this.props.index, revCol)) {
            return null;
          }
          return (
            <tr key={`subtotal${this.props.index}-${revCol}`}>
              <th
                className="pvtTotalLabel"
                colSpan={
                  this.props.rowAttrs.length -
                  revCol +
                  (this.props.colAttrs.length === 0 ? 0 : 1)
                }
              >
                Subtotal {txt}
              </th>
            </tr>
          );
        });
    }
  }
  Subtotal.defaultProps = PivotData.defaultProps;
  Subtotal.propTypes = PivotData.propTypes;

  class TableRenderer extends React.Component {
    constructor(props) {
      super(props);
      this.subtotals = true;
      this.grouping = {tete: 'tata'};
    }

    /* groupingBy = (arr, start, end, col, output) => {
      output[arr[0][0]] = {};
    };*/

    render() {
      const pivotData = new PivotData(this.props);
      const colAttrs = pivotData.props.cols;
      const rowAttrs = pivotData.props.rows;
      const rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();
      const grandTotalAggregator = pivotData.getAggregator([], []);

      // this.groupingBy(rowAttrs, 0, rowAttrs.length - 1, 0, this.grouping);

      let valueCellColors = () => {};
      let rowTotalColors = () => {};
      let colTotalColors = () => {};

      if (opts.heatmapMode) {
        const colorScaleGenerator = this.props.tableColorScaleGenerator;
        const rowTotalValues = colKeys.map(x =>
          pivotData.getAggregator([], x).value()
        );
        rowTotalColors = colorScaleGenerator(rowTotalValues);
        const colTotalValues = rowKeys.map(x =>
          pivotData.getAggregator(x, []).value()
        );
        colTotalColors = colorScaleGenerator(colTotalValues);

        if (opts.heatmapMode === 'full') {
          const allValues = [];
          rowKeys.map(r =>
            colKeys.map(c =>
              allValues.push(pivotData.getAggregator(r, c).value())
            )
          );
          const colorScale = colorScaleGenerator(allValues);
          valueCellColors = (r, c, v) => colorScale(v);
        } else if (opts.heatmapMode === 'row') {
          const rowColorScales = {};
          rowKeys.map(r => {
            const rowValues = colKeys.map(x =>
              pivotData.getAggregator(r, x).value()
            );
            rowColorScales[r] = colorScaleGenerator(rowValues);
          });
          valueCellColors = (r, c, v) => rowColorScales[r](v);
        } else if (opts.heatmapMode === 'col') {
          const colColorScales = {};
          colKeys.map(c => {
            const colValues = rowKeys.map(x =>
              pivotData.getAggregator(x, c).value()
            );
            colColorScales[c] = colorScaleGenerator(colValues);
          });
          valueCellColors = (r, c, v) => colColorScales[c](v);
        }
      }

      const getClickHandler =
        this.props.tableOptions && this.props.tableOptions.clickCallback
          ? (value, rowValues, colValues) => {
              const filters = {};
              for (const i of Object.keys(colAttrs || {})) {
                const attr = colAttrs[i];
                if (colValues[i] !== null) {
                  filters[attr] = colValues[i];
                }
              }
              for (const i of Object.keys(rowAttrs || {})) {
                const attr = rowAttrs[i];
                if (rowValues[i] !== null) {
                  filters[attr] = rowValues[i];
                }
              }
              return e =>
                this.props.tableOptions.clickCallback(
                  e,
                  value,
                  filters,
                  pivotData
                );
            }
          : null;

      return (
        <table className="pvtTable">
          <thead>
            {colAttrs.map(function(c, j) {
              return (
                <tr key={`colAttr${j}`}>
                  {j === 0 &&
                    rowAttrs.length !== 0 && (
                      <th colSpan={rowAttrs.length} rowSpan={colAttrs.length} />
                    )}
                  <th className="pvtAxisLabel">{c}</th>
                  {colKeys.map(function(colKey, i) {
                    const x = spanSize(colKeys, i, j);
                    if (x === -1) {
                      return null;
                    }
                    return (
                      <th
                        className="pvtColLabel"
                        key={`colKey${i}`}
                        colSpan={x}
                        rowSpan={
                          j === colAttrs.length - 1 && rowAttrs.length !== 0
                            ? 2
                            : 1
                        }
                      >
                        {colKey[j]}
                      </th>
                    );
                  })}

                  {j === 0 && (
                    <th
                      className="pvtTotalLabel"
                      rowSpan={
                        colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)
                      }
                    >
                      Totals
                    </th>
                  )}
                  {opts.subtotals && rowAttrs.length > 1 ? (
                    <th className="pvtTotalLabel">Subtotals</th>
                  ) : (
                    ''
                  )}
                </tr>
              );
            })}

            {rowAttrs.length !== 0 && (
              <tr>
                {rowAttrs.map(function(r, i) {
                  return (
                    <th className="pvtAxisLabel" key={`rowAttr${i}`}>
                      {r}
                    </th>
                  );
                })}

                <th className="pvtTotalLabel">
                  {colAttrs.length === 0 ? 'Totals' : null}
                </th>
              </tr>
            )}
          </thead>

          <tbody>
            {rowKeys.map(function(rowKey, i) {
              const totalAggregator = pivotData.getAggregator(rowKey, []);
              return (
                <React.Fragment key={`fragment-${i}`}>
                  <tr key={`rowKeyRow${i}`}>
                    {rowKey.map(function(txt, j) {
                      let x = spanSize(rowKeys, i, j);
                      if (x === -1) {
                        return null;
                      }
                      x += calculateSutotalsParentspan(rowKeys, i, j);

                      return (
                        <th
                          key={`rowKeyLabel${i}-${j}`}
                          className="pvtRowLabel"
                          rowSpan={x}
                          colSpan={
                            j === rowAttrs.length - 1 && colAttrs.length !== 0
                              ? 2
                              : 1
                          }
                        >
                          {txt}
                        </th>
                      );
                    })}
                    {colKeys.map(function(colKey, j) {
                      const aggregator = pivotData.getAggregator(
                        rowKey,
                        colKey
                      );
                      return (
                        <td
                          className="pvtVal"
                          key={`pvtVal${i}-${j}`}
                          onClick={
                            getClickHandler &&
                            getClickHandler(aggregator.value(), rowKey, colKey)
                          }
                          style={valueCellColors(
                            rowKey,
                            colKey,
                            aggregator.value()
                          )}
                        >
                          {aggregator.format(aggregator.value())}
                        </td>
                      );
                    })}
                    <td
                      className="pvtTotal"
                      onClick={
                        getClickHandler &&
                        getClickHandler(totalAggregator.value(), rowKey, [null])
                      }
                      style={colTotalColors(totalAggregator.value())}
                    >
                      {totalAggregator.format(totalAggregator.value())}
                    </td>
                  </tr>

                  <Subtotal
                    key={i}
                    rowKeys={rowKeys}
                    index={i}
                    row={rowKey}
                    rowAttrs={rowAttrs}
                    colAttrs={colAttrs}
                  />
                </React.Fragment>
              );
            })}

            {opts.subtotals && colAttrs.length > 1 ? (
              <tr>
                <th
                  className="pvtTotalLabel"
                  colSpan={rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)}
                >
                  Subtotals
                </th>
                {colKeys.map(function(colKey, i) {
                  return (
                    <td className="pvtTotal" key={`subtotal${i}`}>
                      t
                    </td>
                  );
                })}
              </tr>
            ) : (
              ''
            )}
            <tr>
              <th
                className="pvtTotalLabel"
                colSpan={rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)}
              >
                Totals
              </th>

              {colKeys.map(function(colKey, i) {
                const totalAggregator = pivotData.getAggregator([], colKey);
                return (
                  <td
                    className="pvtTotal"
                    key={`total${i}`}
                    onClick={
                      getClickHandler &&
                      getClickHandler(totalAggregator.value(), [null], colKey)
                    }
                    style={rowTotalColors(totalAggregator.value())}
                  >
                    {totalAggregator.format(totalAggregator.value())}
                  </td>
                );
              })}

              <td
                onClick={
                  getClickHandler &&
                  getClickHandler(grandTotalAggregator.value(), [null], [null])
                }
                className="pvtGrandTotal"
              >
                {grandTotalAggregator.format(grandTotalAggregator.value())}
              </td>
            </tr>
          </tbody>
        </table>
      );
    }
  }

  TableRenderer.defaultProps = PivotData.defaultProps;
  TableRenderer.propTypes = PivotData.propTypes;
  TableRenderer.defaultProps.tableColorScaleGenerator = redColorScaleGenerator;
  TableRenderer.defaultProps.tableOptions = {};
  TableRenderer.propTypes.tableColorScaleGenerator = PropTypes.func;
  TableRenderer.propTypes.tableOptions = PropTypes.object;
  return TableRenderer;
}

class TSVExportRenderer extends React.PureComponent {
  render() {
    const pivotData = new PivotData(this.props);
    const rowKeys = pivotData.getRowKeys();
    const colKeys = pivotData.getColKeys();
    if (rowKeys.length === 0) {
      rowKeys.push([]);
    }
    if (colKeys.length === 0) {
      colKeys.push([]);
    }

    const headerRow = pivotData.props.rows.map(r => r);
    if (colKeys.length === 1 && colKeys[0].length === 0) {
      headerRow.push(this.props.aggregatorName);
    } else {
      colKeys.map(c => headerRow.push(c.join('-')));
    }

    const result = rowKeys.map(r => {
      const row = r.map(x => x);
      colKeys.map(c => {
        const v = pivotData.getAggregator(r, c).value();
        row.push(v ? v : '');
      });
      return row;
    });

    result.unshift(headerRow);

    return (
      <textarea
        value={result.map(r => r.join('\t')).join('\n')}
        style={{width: window.innerWidth / 2, height: window.innerHeight / 2}}
        readOnly={true}
      />
    );
  }
}

TSVExportRenderer.defaultProps = PivotData.defaultProps;
TSVExportRenderer.propTypes = PivotData.propTypes;

export default {
  Table: makeRenderer(),
  'Table Heatmap': makeRenderer({heatmapMode: 'full'}),
  'Table Col Heatmap': makeRenderer({heatmapMode: 'col'}),
  'Table Row Heatmap': makeRenderer({heatmapMode: 'row'}),
  'Table With Subtotals': makeRenderer({subtotals: 'yes'}),
  'Exportable TSV': TSVExportRenderer,
};
