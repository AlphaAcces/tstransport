import { NetworkNode, NetworkEdge } from '../types';

export const nodes: NetworkNode[] = [
  { id: 'uc', label: 'Ümit Cetin', sublabel: 'UBO / Direktør', type: 'person', x: 350, y: 50, riskLevel: 'Medium', notes: '100% ejer af CESR Holding. Stifter og direktør i alle aktive selskaber.' },
  { id: 'cesr_holding', label: 'CESR Holding ApS', sublabel: 'Holding', type: 'company', x: 350, y: 150, riskLevel: 'Medium', cvr: '43579290', notes: 'Central enhed for kapitalbeskyttelse.' },
  { id: 'ts_logistik', label: 'TS Logistik ApS', sublabel: 'Drift (Vognmand)', type: 'company', x: 150, y: 250, riskLevel: 'High', cvr: '38585290', notes: 'Operationel motor. Kilde til kapitaldræn og centrum for skattesag.' },
  { id: 'cesr_ejendomme', label: 'CESR Ejendomme ApS', sublabel: 'Ejendomme', type: 'company', x: 350, y: 250, riskLevel: 'Low', cvr: '43712683', notes: 'Modtager af 5 mio. DKK udbytte. Passive investeringer.' },
  { id: 'cesr_aps', label: 'CESR ApS', sublabel: 'Bilsalg', type: 'company', x: 550, y: 250, riskLevel: 'Medium', cvr: '44118033', notes: 'Højrisikobranche. Tidligere direktør Cömert Avci.' },
  { id: 'lund_capital', label: 'Lund Capital', sublabel: 'Historisk', type: 'historical', x: 150, y: 350, riskLevel: 'Low', cvr: '40423249', notes: 'Stiftet af Cetin, nu ejet af M.D. Tirpan.' },
];

export const edges: NetworkEdge[] = [
  { from: 'uc', to: 'cesr_holding', type: 'ownership' },
  { from: 'cesr_holding', to: 'ts_logistik', type: 'ownership' },
  { from: 'cesr_holding', to: 'cesr_ejendomme', type: 'ownership' },
  { from: 'cesr_holding', to: 'cesr_aps', type: 'ownership' },
  { from: 'uc', to: 'lund_capital', type: 'historical' },
];