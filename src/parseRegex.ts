/**
 * @copyright   Copyright (c) 2014-20 Ionică Bizău <bizauionica@gmail.com> (https://ionicabizau.net)
 * @copyright   Copyright (c) 2021 Yannick Deubel (https://github.com/yandeu)
 * @license     {@link https://github.com/IonicaBizau/regex-parser.js/blob/master/LICENSE MIT}
 * @description Copied and modified from https://github.com/IonicaBizau/regex-parser.js/blob/master/lib/index.js
 */

export const parseRegex = (input: string) => {
  // Validate input
  if (typeof input !== 'string') throw new Error('Invalid input. Input must be a string')

  // Parse input
  const m = input.match(/(\/?)(.+)\1([a-z]*)/i)
  if (!m) throw new Error('Regex parse error.')

  // Invalid flags
  if (m[3] && !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(m[3])) return RegExp(input)

  // Create the regular expression
  return new RegExp(m[2], m[3])
}
