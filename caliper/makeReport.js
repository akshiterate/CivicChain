'use strict';

// Turns one Caliper console log into a results folder:
//   charts.html - tables + bar charts (charts are hand-written SVG, no chart library)
//   report.md   - same tables as markdown, so git diffs are readable
//   results.csv - raw numbers for Excel / Google Sheets
//
// Never writes to report.html: that file is Caliper's own raw HTML output and
// stays untouched as evidence.
//
// The numbers are PARSED from Caliper's own "### All test results ###" table,
// never typed in by hand. If the log has no such table, the script exits with
// an error instead of producing a report with invented numbers.
//
// Usage (run from the caliper/ folder):
//   node makeReport.js results/2026-10-26/benchmark-full.log results/2026-10-26

const fs = require('fs');
const path = require('path');

// Caliper prints ANSI colour codes; they must go before we can read the table.
function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, '').replace(/\[\d{1,2}m/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Reads the "### All test results ###" table at the end of a Caliper log.
function parseResults(logText) {
  const lines = stripAnsi(logText).split(/\r?\n/);

  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('### All test results ###')) {
      startLine = i;
    }
  }
  if (startLine === -1) {
    throw new Error('No "### All test results ###" table found. Did Caliper finish?');
  }

  const rounds = [];
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) {
      continue;
    }

    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 8) {
      continue;
    }

    const isSeparator = cells.every((cell) => /^:?-{2,}:?$/.test(cell));
    if (isSeparator) {
      continue;
    }

    const succ = Number(cells[1]);
    const fail = Number(cells[2]);
    if (!Number.isFinite(succ) || !Number.isFinite(fail)) {
      continue; // header row ("Succ", "Fail") lands here
    }

    rounds.push({
      name: cells[0],
      succ: succ,
      fail: fail,
      sendRate: Number(cells[3]),
      maxLatency: Number(cells[4]),
      minLatency: Number(cells[5]),
      avgLatency: Number(cells[6]),
      throughput: Number(cells[7])
    });
  }

  if (rounds.length === 0) {
    throw new Error('Result table found but no data rows could be read.');
  }
  return rounds;
}

// Finds the benchmark timestamp Caliper logged on its first line.
function parseRunStamp(logText) {
  const match = stripAnsi(logText).match(/(\d{4})\.(\d{2})\.(\d{2})-(\d{2}):(\d{2}):(\d{2})/);
  if (match === null) {
    return '';
  }
  return match[1] + '-' + match[2] + '-' + match[3] + ' ' + match[4] + ':' + match[5] + ':' + match[6];
}

// ---------------------------------------------------------------------------
// Chart drawing. A bar chart is just <rect> elements on a fixed pixel grid,
// so no charting library is needed and the output is one self-contained file.
// ---------------------------------------------------------------------------
function buildBarChart(title, labels, series, unit) {
  const width = 760;
  const height = 300;
  const padLeft = 68;
  const padRight = 24;
  const padTop = 52;
  const padBottom = 68;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  let biggest = 0;
  for (const oneSeries of series) {
    for (const value of oneSeries.values) {
      if (value > biggest) {
        biggest = value;
      }
    }
  }
  if (biggest === 0) {
    biggest = 1;
  }
  const maxValue = biggest * 1.15;
  // Sub-second values (latency charts) need more decimals than TPS charts,
  // otherwise every axis label would read "0.0".
  const decimals = maxValue < 1 ? 3 : 1;

  const parts = [];
  parts.push('<svg class="chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeHtml(title) + '">');
  parts.push('<text x="' + padLeft + '" y="26" class="chart-title">' + escapeHtml(title) + '</text>');

  // Horizontal gridlines + axis labels (0, 25%, 50%, 75%, 100% of max).
  const steps = 4;
  for (let step = 0; step <= steps; step++) {
    const value = (maxValue * step) / steps;
    const y = padTop + plotHeight - (value / maxValue) * plotHeight;
    parts.push('<line x1="' + padLeft + '" y1="' + y.toFixed(1) + '" x2="' + (padLeft + plotWidth) + '" y2="' + y.toFixed(1) + '" class="grid" />');
    parts.push('<text x="' + (padLeft - 8) + '" y="' + (y + 4).toFixed(1) + '" class="axis" text-anchor="end">' + value.toFixed(decimals) + '</text>');
  }

  const groupWidth = plotWidth / labels.length;
  const barWidth = (groupWidth * 0.68) / series.length;

  for (let i = 0; i < labels.length; i++) {
    const groupStart = padLeft + i * groupWidth + groupWidth * 0.16;

    for (let j = 0; j < series.length; j++) {
      const value = series[j].values[i];
      const barHeight = (value / maxValue) * plotHeight;
      const x = groupStart + j * barWidth;
      const y = padTop + plotHeight - barHeight;
      parts.push(
        '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (barWidth * 0.86).toFixed(1) +
        '" height="' + barHeight.toFixed(1) + '" fill="' + series[j].colour + '" />'
      );
      if (value > 0) {
        parts.push(
          '<text x="' + (x + barWidth * 0.43).toFixed(1) + '" y="' + (y - 5).toFixed(1) +
          '" class="bar-value" text-anchor="middle">' + value + '</text>'
        );
      }
    }

    const labelX = padLeft + i * groupWidth + groupWidth / 2;
    parts.push(
      '<text x="' + labelX.toFixed(1) + '" y="' + (padTop + plotHeight + 22) +
      '" class="axis" text-anchor="middle">' + escapeHtml(labels[i]) + '</text>'
    );
  }

  // Legend, drawn top-right.
  let legendX = width - padRight;
  for (let k = series.length - 1; k >= 0; k--) {
    const textWidth = series[k].name.length * 6.5;
    legendX = legendX - textWidth - 26;
    parts.push('<rect x="' + legendX.toFixed(1) + '" y="16" width="12" height="12" fill="' + series[k].colour + '" />');
    parts.push('<text x="' + (legendX + 18).toFixed(1) + '" y="26" class="axis">' + escapeHtml(series[k].name) + '</text>');
    legendX = legendX - 10;
  }

  parts.push('<text x="' + (padLeft + plotWidth) + '" y="' + (height - 10) + '" class="axis" text-anchor="end">' + escapeHtml(unit) + '</text>');
  parts.push('</svg>');
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Output writers
// ---------------------------------------------------------------------------
function buildHtml(rounds, meta) {
  const labels = rounds.map((round) => round.name);
  const totalSucc = rounds.reduce((sum, round) => sum + round.succ, 0);
  const totalFail = rounds.reduce((sum, round) => sum + round.fail, 0);
  const verdict = totalFail === 0 ? 'ALL ROUNDS PASSED' : totalFail + ' FAILED TRANSACTIONS';

  const sendVsThroughput = buildBarChart(
    'Send rate vs throughput',
    labels,
    [
      { name: 'Send rate', colour: '#7f9db9', values: rounds.map((round) => round.sendRate) },
      { name: 'Throughput', colour: '#1f7a4d', values: rounds.map((round) => round.throughput) }
    ],
    'transactions per second'
  );

  const latencyChart = buildBarChart(
    'Average latency',
    labels,
    [{ name: 'Avg latency', colour: '#b3701f', values: rounds.map((round) => round.avgLatency) }],
    'seconds'
  );

  const outcomeChart = buildBarChart(
    'Succeeded vs failed transactions',
    labels,
    [
      { name: 'Succeeded', colour: '#1f7a4d', values: rounds.map((round) => round.succ) },
      { name: 'Failed', colour: '#b03030', values: rounds.map((round) => round.fail) }
    ],
    'transactions'
  );

  let tableRows = '';
  for (const round of rounds) {
    tableRows +=
      '<tr><td>' + escapeHtml(round.name) + '</td><td>' + round.succ + '</td><td>' + round.fail +
      '</td><td>' + round.sendRate + '</td><td>' + round.maxLatency + '</td><td>' + round.minLatency +
      '</td><td>' + round.avgLatency + '</td><td>' + round.throughput + '</td></tr>\n';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CivicChain Caliper report - ${escapeHtml(meta.stamp || meta.logName)}</title>
<style>
  body { font-family: "Segoe UI", Arial, sans-serif; margin: 32px; color: #1c2530; background: #f7f8fa; }
  h1 { font-size: 22px; margin: 0 0 4px 0; }
  h2 { font-size: 16px; margin: 28px 0 10px 0; border-bottom: 1px solid #dde2e8; padding-bottom: 6px; }
  .sub { color: #5a6672; font-size: 13px; margin-bottom: 18px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 3px; font-size: 12px; font-weight: 600; }
  .badge.pass { background: #e2f2ea; color: #1f7a4d; }
  .badge.warn { background: #fbe6e6; color: #b03030; }
  .card { background: #ffffff; border: 1px solid #dde2e8; border-radius: 4px; padding: 18px; margin-bottom: 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; background: #ffffff; }
  th, td { border: 1px solid #dde2e8; padding: 7px 10px; text-align: right; }
  th { background: #eef1f5; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
  svg.chart { width: 100%; height: auto; display: block; }
  .chart-title { font-size: 13px; font-weight: 600; fill: #1c2530; }
  .axis { font-size: 11px; fill: #5a6672; }
  .bar-value { font-size: 11px; fill: #1c2530; }
  .grid { stroke: #e3e7ec; stroke-width: 1; }
  footer { margin-top: 24px; font-size: 12px; color: #5a6672; }
  code { background: #eef1f5; padding: 1px 5px; border-radius: 3px; }
</style>
</head>
<body>
  <h1>CivicChain Caliper report</h1>
  <div class="sub">
    Run: ${escapeHtml(meta.stamp || 'unknown time')} &middot;
    source log: <code>${escapeHtml(meta.logName)}</code> &middot;
    contract: <code>${escapeHtml(meta.contractAddress)}</code> &middot;
    chain: local Hardhat node (31337)
    <br><span class="badge ${totalFail === 0 ? 'pass' : 'warn'}">${escapeHtml(verdict)}</span>
  </div>

  <div class="card">
    <h2>Summary</h2>
    <table>
      <tr><th>Round</th><th>Succ</th><th>Fail</th><th>Send rate (TPS)</th><th>Max lat (s)</th><th>Min lat (s)</th><th>Avg lat (s)</th><th>Throughput (TPS)</th></tr>
      ${tableRows}
      <tr><td><strong>Total</strong></td><td><strong>${totalSucc}</strong></td><td><strong>${totalFail}</strong></td><td colspan="5"></td></tr>
    </table>
  </div>

  <div class="card">${sendVsThroughput}</div>
  <div class="card">${latencyChart}</div>
  <div class="card">${outcomeChart}</div>

  <footer>
    Numbers parsed from Caliper's own console report, not typed by hand.
    Latencies reflect Hardhat automine on a local node; they say nothing about
    Sepolia or mainnet performance. Charts are inline SVG, generated by
    <code>caliper/makeReport.js</code> - no charting library.
  </footer>
</body>
</html>
`;
}

function buildMarkdown(rounds, meta) {
  let text = '# CivicChain Caliper results - ' + (meta.stamp || meta.logName) + '\n\n';
  text += '- Source log: `' + meta.logName + '`\n';
  text += '- Contract: `' + meta.contractAddress + '`\n';
  text += '- Chain: local Hardhat node (chainId 31337), automine\n';
  text += '- Charts: `charts.html` (same folder)\n\n';

  text += '| Round | Succ | Fail | Send rate (TPS) | Max lat (s) | Min lat (s) | Avg lat (s) | Throughput (TPS) |\n';
  text += '|---|---|---|---|---|---|---|---|\n';
  for (const round of rounds) {
    text += '| ' + round.name + ' | ' + round.succ + ' | ' + round.fail + ' | ' + round.sendRate +
      ' | ' + round.maxLatency + ' | ' + round.minLatency + ' | ' + round.avgLatency + ' | ' + round.throughput + ' |\n';
  }

  const totalSucc = rounds.reduce((sum, round) => sum + round.succ, 0);
  const totalFail = rounds.reduce((sum, round) => sum + round.fail, 0);
  text += '\nTotal: ' + totalSucc + ' succeeded, ' + totalFail + ' failed.\n\n';
  text += '> Local automine only. These latencies are not testnet performance.\n';
  return text;
}

function buildCsv(rounds) {
  let text = 'round,succ,fail,send_rate_tps,max_latency_s,min_latency_s,avg_latency_s,throughput_tps\n';
  for (const round of rounds) {
    text += [round.name, round.succ, round.fail, round.sendRate, round.maxLatency,
      round.minLatency, round.avgLatency, round.throughput].join(',') + '\n';
  }
  return text;
}

function main() {
  const logArgument = process.argv[2];
  if (!logArgument) {
    console.error('Usage: node makeReport.js <caliper log file> [output folder]');
    process.exitCode = 1;
    return;
  }

  const logPath = path.resolve(logArgument);
  if (!fs.existsSync(logPath)) {
    console.error('Log file not found: ' + logPath);
    process.exitCode = 1;
    return;
  }

  const outputDir = path.resolve(process.argv[3] || path.dirname(logPath));
  const logText = fs.readFileSync(logPath, 'utf8');
  const rounds = parseResults(logText);

  // The contract address makes the report traceable back to one deployment.
  let contractAddress = '(not recorded)';
  const contractFile = path.join(__dirname, 'contract.json');
  if (fs.existsSync(contractFile)) {
    contractAddress = JSON.parse(fs.readFileSync(contractFile, 'utf8')).address;
  }

  const meta = {
    stamp: parseRunStamp(logText),
    logName: path.basename(logPath),
    contractAddress: contractAddress
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'charts.html'), buildHtml(rounds, meta));
  fs.writeFileSync(path.join(outputDir, 'report.md'), buildMarkdown(rounds, meta));
  fs.writeFileSync(path.join(outputDir, 'results.csv'), buildCsv(rounds));

  console.log('Parsed ' + rounds.length + ' round(s) from ' + path.basename(logPath));
  console.log('Wrote charts.html, report.md, results.csv to ' + outputDir);
}

main();
