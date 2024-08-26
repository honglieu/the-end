export function get2CharacterFromName(name: string) {
  const chars = name?.split(' ');
  if (!chars?.length || chars.length < 1) return '';
  if (chars?.length === 1) {
    return chars[0].substring(0, 2).toUpperCase();
  }
  return (chars[0].charAt(0) + chars[1].charAt(0)).toUpperCase();
}
