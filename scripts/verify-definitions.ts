import { formatDefinitionText } from '../src/game/definitions.ts'

function assertEqual(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

assertEqual(formatDefinitionText('And ; sum of the previous one.'), 'And; sum of the previous one.', 'semicolon')
assertEqual(formatDefinitionText('A small, round <b>spot</b> .'), 'A small, round spot.', 'period')
assertEqual(formatDefinitionText('A greeting ( salutation ) said when meeting.'), 'A greeting (salutation) said when meeting.', 'parentheses')
assertEqual(formatDefinitionText('Zero , no score.'), 'Zero, no score.', 'comma')
assertEqual(
  formatDefinitionText('(to or from a place) ; dash or errand , trip .'),
  '(to or from a place); dash or errand, trip.',
  'mixed punctuation',
)
assertEqual(formatDefinitionText('To hoist (an anchor ) by its ring.'), 'To hoist (an anchor) by its ring.', 'closing paren')
assertEqual(formatDefinitionText('U.S. army'), 'U.S. army', 'abbreviation')
assertEqual(formatDefinitionText('1.5 meters'), '1.5 meters', 'decimal')

console.log('definition formatting ok')
