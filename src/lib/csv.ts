/** Escapes one CSV cell. Cells that start with = + - @ are prefixed so spreadsheets do not run them as formulas. */
function cell(value: unknown) {
  let text = value instanceof Date ? value.toISOString() : String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(columns: string[], rows: unknown[][]) {
  // The BOM lets Excel open the file as UTF-8.
  return '﻿' + [columns.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))].join('\r\n');
}
