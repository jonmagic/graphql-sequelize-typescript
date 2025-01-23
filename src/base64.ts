// Public: Convert an ASCII string to a Base64-encoded string.
//
// Examples
//
//   base64('hello')
//   // => 'aGVsbG8='
//
// input - A String representing the ASCII input to encode.
//
// Returns a String containing the Base64-encoded representation of the input.
// Throws a TypeError if the input is not a string.
export function base64(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string')
  }
  return Buffer.from(input, 'ascii').toString('base64')
}

// Public: Decode a Base64-encoded string to an ASCII string.
//
// Examples
//
//   unbase64('aGVsbG8=')
//   // => 'hello'
//
// input - A String representing the Base64 input to decode.
//
// Returns a String containing the decoded ASCII representation of the input.
// Throws a TypeError if the input is not a string.
export function unbase64(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string')
  }
  return Buffer.from(input, 'base64').toString('ascii')
}
