import { NetworkNode, NetworkEdge } from '../../types';

export const nodes: NetworkNode[] = [
  { id: 'uc', label: 'Ümit Cetin', sublabel: 'UBO / Privatperson', type: 'person', x: 350, y: 50, riskLevel: 'High', notes: 'Central figur med 100% kontrol. Bærer den ultimative juridiske og finansielle risiko.' },
  { id: 'cesr_holding', label: 'CESR Holding ApS', sublabel: 'Aktiv-beskyttelse', type: 'company', x: 350, y: 150, riskLevel: 'Medium', cvr: '43579290', notes: 'Nøgle-enhed for at isolere værdier fra driftsrisiko.' },
  { id: 'ts_logistik', label: 'TS Logistik ApS', sublabel: 'Finansiel motor', type: 'company', x: 150, y: 250, riskLevel: 'High', cvr: '38585290', notes: 'Kilden til kapital, men også til den primære risiko (drift, skat).' },
  { id: 'cesr_ejendomme', label: 'CESR Ejendomme ApS', sublabel: 'Værdiopbevaring', type: 'company', x: 550, y: 250, riskLevel: 'Low', cvr: '43712683', notes: 'Modtager af udloddet kapital; passiv investering.' },
  { id: 'skat', label: 'Skattestyrelsen', sublabel: 'Modpart', type: 'historical', x: 150, y: 350, riskLevel: 'High', notes: 'Aktiv skattesag udgør en eksistentiel trussel mod hele strukturen.' },
  { id: 'revisor', label: 'Revisor Danielsen', sublabel: 'Rådgiver', type: 'historical', x: 550, y: 350, riskLevel: 'Medium', notes: 'Har godkendt regnskaber med høj-risiko dispositioner.' },
];

export const edges: NetworkEdge[] = [
  { from: 'uc', to: 'cesr_holding', type: 'ownership' },
  { from: 'cesr_holding', to: 'ts_logistik', type: 'ownership' },
  { from: 'cesr_holding', to: 'cesr_ejendomme', type: 'ownership' },
  { from: 'ts_logistik', to: 'cesr_holding', type: 'transaction' },
  { from: 'ts_logistik', to: 'skat', type: 'transaction' },
  { from: 'uc', to: 'revisor', type: 'transaction' },
];
