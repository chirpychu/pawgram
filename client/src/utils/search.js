// Escapes ILIKE wildcard characters in free-typed search text so a literal
// "%" or "_" in someone's query doesn't act as a SQL wildcard.
export function escapeLikePattern(term) {
  return term.replace(/[%_]/g, (m) => '\\' + m)
}
