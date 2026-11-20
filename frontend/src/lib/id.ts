

export function id(prefix: string) {
  const rnd = Math.random().toString(16).slice(2);
  const t = Date.now().toString(16);
  return `${prefix}_${t}_${rnd}`;
}
