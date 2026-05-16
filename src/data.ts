export type Kid = { id: string; name: string; grade: number; color: string };

export const KIDS: Kid[] = [
  { id: 'ezra', name: 'Ezra', grade: 3, color: '#E08A2A' },
  { id: 'iris', name: 'Iris', grade: 1, color: '#3A5BD9' },
  { id: 'theo', name: 'Theo', grade: 5, color: '#1F7A4E' },
];

export type Stop = { name: string; addr: string; time: string };

export const STOPS: Stop[] = [
  { name: 'Maya Park', addr: 'R. Cedro · 207', time: '7:54' },
  { name: 'Noah Singh', addr: 'R. Bétula · 14', time: '8:02' },
  { name: 'Ezra (você)', addr: 'Av. Maple · 88', time: '8:12' },
  { name: 'Iris Bell', addr: 'Pç. Carvalho · 31', time: '8:22' },
  { name: 'Theo Wong', addr: 'Av. Pinheiros · 5', time: '8:30' },
  { name: 'Escola Greenfield', addr: 'Chegada', time: '8:42' },
];

export type MapStop = { x: number; y: number; status: 'done' | 'now' | 'next' };

export const MAP_STOPS: MapStop[] = [
  { x: 240, y: 30, status: 'done' },
  { x: 295, y: 100, status: 'done' },
  { x: 230, y: 120, status: 'now' },
  { x: 330, y: 200, status: 'next' },
  { x: 230, y: 280, status: 'next' },
  { x: 130, y: 320, status: 'next' },
];

export const DRIVER = {
  name: 'Marcus Tan',
  rating: 4.9,
  van: 'VK-32',
  color: '#5B7A9F',
};

export const ROUTE_PATH =
  'M 30 60 C 110 40, 150 110, 230 120 S 340 200, 300 260 S 110 320, 60 360';

export type RosterKid = {
  name: string;
  addr: string;
  time: string;
  color: string;
  parent: string;
};

export const ROSTER: RosterKid[] = [
  { name: 'Maya Park', addr: 'R. Cedro · 207', time: '7:54', color: '#9F5BC0', parent: 'Hana Park' },
  { name: 'Noah Singh', addr: 'R. Bétula · 14', time: '8:02', color: '#5B7A9F', parent: 'Ravi Singh' },
  { name: 'Ezra Vance', addr: 'Av. Maple · 88', time: '8:12', color: '#E08A2A', parent: 'Sara Vance' },
  { name: 'Iris Bell', addr: 'Pç. Carvalho · 31', time: '8:22', color: '#3A5BD9', parent: 'Tom Bell' },
  { name: 'Theo Wong', addr: 'Av. Pinheiros · 5', time: '8:30', color: '#1F7A4E', parent: 'Mei Wong' },
];
