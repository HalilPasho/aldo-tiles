export function byOrder(a: { data: { order: number } }, b: { data: { order: number } }): number {
  return a.data.order - b.data.order;
}
