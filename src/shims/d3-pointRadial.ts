export default function pointRadial(angle: number, radius: number): [number, number] {
  const r = +radius;
  const a = angle - Math.PI / 2;
  return [r * Math.cos(a), r * Math.sin(a)];
}
