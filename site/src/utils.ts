// A random-ish identifier string, using the same alphabet the original demo
// used (Crockford-ish: no easily-confused characters).
const CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function randomString(len = 34): string {
  let s = ''
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)]
  return s
}
