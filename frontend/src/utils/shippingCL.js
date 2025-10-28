// Estimador simple de envío en RM (Santiago)
const strip = (s='') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const ZONES = {
  centro: { price: 2990, comunas: ['santiago','providencia','nunoa','las condes','vitacura','lo barnechea','recoleta','independencia','macul','san miguel','estacion central'] },
  pericentro: { price: 3990, comunas: ['la reina','penalolen','quinta normal','san joaquin','la cisterna','san ramon','pedro aguirre cerda','lo prado','cerrillos','huechuraba'] },
  periferia: { price: 5990, comunas: ['maipu','la florida','puente alto','la granja','el bosque','renca','conchali','quilicura','cerro navia','pudahuel'] },
  extremo: { price: 8990, comunas: ['padre hurtado','san bernardo','buin','lampa','colina','tiltil','paine','penaflor','talagante','calera de tango','isla de maipo','melipilla'] },
};

export function estimateShippingFront({ metodo='delivery', comuna='', region='' }={}) {
  const m = String(metodo).toLowerCase();
  if (m === 'retiro') return { zone: 'retiro', price: 0 };
  const c = strip(comuna);
  for (const [zone, cfg] of Object.entries(ZONES)) {
    if (cfg.comunas.some((x) => strip(x) === c)) return { zone, price: cfg.price };
  }
  const r = strip(region);
  if (r && !['rm','metropolitana','region metropolitana'].includes(r)) return { zone: 'fuera_rm', price: 12990 };
  return { zone: 'periferia', price: ZONES.periferia.price };
}

export const SCL_ZONES = ZONES;

export function getRMComunas() {
  const set = new Set();
  Object.values(ZONES).forEach(z => (z.comunas || []).forEach(c => set.add(c)));
  return Array.from(set).sort((a,b)=>a.localeCompare(b)).map(c => c.replace(/\b([a-z])/g, (m,p)=>p.toUpperCase()).replace('Nunoa','Ñuñoa').replace('Penalolen','Peñalolén'));
}

export function getChileRegions() {
  return [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana',
    "O'Higgins",
    'Maule',
    'Ñuble',
    'Biobío',
    'La Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes'
  ];
}