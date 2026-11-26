// The line shown under the heading: "3 notes", "1 note", or "No notes yet".
// Plain function with no outside references: app.js also inlines it into the page.
export function countLabel(n) {
  if (n === 0) return 'No notes yet';
  return n === 1 ? '1 note' : n.toLocaleString('en-US') + ' notes';
}
