import { NetworkNode, NetworkEdge } from '../types';

export const nodes: NetworkNode[] = [
  { id: 'uc', label: 'Ümit Cetin', sublabel: 'UBO / Direktør', type: 'person', x: 350, y: 50, riskLevel: 'Medium', status: 'active', clusterId: 'management', isHighlighted: true, size: 1.2, connections: 5, notes: '100% ejer af CESR Holding. Stifter og direktør i alle aktive selskaber.' },
  { id: 'cesr_holding', label: 'CESR Holding ApS', sublabel: 'Holding', type: 'company', x: 350, y: 150, riskLevel: 'Medium', status: 'active', clusterId: 'holding', isHighlighted: true, size: 1.0, connections: 4, cvr: '43579290', notes: 'Central enhed for kapitalbeskyttelse.' },
  { id: 'ts_logistik', label: 'TS Logistik ApS', sublabel: 'Drift (Vognmand)', type: 'company', x: 150, y: 250, riskLevel: 'High', status: 'active', clusterId: 'operations', isHighlighted: true, size: 1.1, connections: 2, cvr: '38585290', notes: 'Operationel motor. Kilde til kapitaldræn og centrum for skattesag.' },
  { id: 'cesr_ejendomme', label: 'CESR Ejendomme ApS', sublabel: 'Ejendomme', type: 'company', x: 350, y: 250, riskLevel: 'Low', status: 'active', clusterId: 'assets', isHighlighted: false, size: 0.9, connections: 1, cvr: '43712683', notes: 'Modtager af 5 mio. DKK udbytte. Passive investeringer.' },
  { id: 'cesr_aps', label: 'CESR ApS', sublabel: 'Bilsalg', type: 'company', x: 550, y: 250, riskLevel: 'Medium', status: 'active', clusterId: 'operations', isHighlighted: false, size: 1.0, connections: 1, cvr: '44118033', notes: 'Højrisikobranche. Tidligere direktør Cömert Avci.' },
  { id: 'lund_capital', label: 'Lund Capital', sublabel: 'Historisk', type: 'historical', x: 150, y: 350, riskLevel: 'Low', status: 'inactive', clusterId: 'historical', isHighlighted: false, size: 0.8, connections: 1, cvr: '40423249', notes: 'Stiftet af Cetin, nu ejet af M.D. Tirpan.' },
];

export const edges: NetworkEdge[] = [
  { from: 'uc', to: 'cesr_holding', type: 'ownership', weight: 5, isHighlighted: true, label: '100% ejerandel' },
  { from: 'cesr_holding', to: 'ts_logistik', type: 'ownership', weight: 3, isHighlighted: true, label: 'Ejerskab' },
  { from: 'cesr_holding', to: 'cesr_ejendomme', type: 'ownership', weight: 2, isHighlighted: false, label: 'Ejerskab' },
  { from: 'cesr_holding', to: 'cesr_aps', type: 'ownership', weight: 2, isHighlighted: false, label: 'Ejerskab' },
  { from: 'uc', to: 'lund_capital', type: 'historical', weight: 1, isHighlighted: false, label: 'Historisk' },
];
