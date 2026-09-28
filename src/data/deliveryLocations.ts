export interface DeliveryLocation {
  id: string;
  neighborhood: string;
  fee: number;
  estimatedTime?: string;
  active: boolean;
}

export const DEFAULT_DELIVERY_LOCATIONS: DeliveryLocation[] = [
  { id: '1', neighborhood: 'Centro', fee: 5.0, estimatedTime: '25-35 min', active: true },
  { id: '2', neighborhood: 'Jardim das Flores', fee: 6.0, estimatedTime: '30-40 min', active: true },
  { id: '3', neighborhood: 'Vila Nova', fee: 7.0, estimatedTime: '35-45 min', active: true },
  { id: '4', neighborhood: 'Bela Vista', fee: 8.0, estimatedTime: '35-45 min', active: true },
  { id: '5', neighborhood: 'Jardim América', fee: 8.0, estimatedTime: '35-45 min', active: true },
  { id: '6', neighborhood: 'São Judas', fee: 9.0, estimatedTime: '40-50 min', active: true },
  { id: '7', neighborhood: 'Parque Industrial', fee: 10.0, estimatedTime: '40-50 min', active: true },
  { id: '8', neighborhood: 'Bairro Alto', fee: 10.0, estimatedTime: '45-55 min', active: true },
  { id: '9', neighborhood: 'Outro Bairro / Consultar', fee: 8.0, estimatedTime: '40-55 min', active: true },
];

const STORAGE_KEY = 'aqf_delivery_locations_list';

export const getDeliveryLocations = (): DeliveryLocation[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao ler locais de entrega:', e);
  }
  return DEFAULT_DELIVERY_LOCATIONS;
};

export const saveDeliveryLocations = (locations: DeliveryLocation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (e) {
    console.error('Erro ao salvar locais de entrega:', e);
  }
};

export const findDeliveryFee = (neighborhoodName: string, locations?: DeliveryLocation[]): number => {
  const list = locations || getDeliveryLocations();
  const clean = neighborhoodName.trim().toLowerCase();
  const match = list.find((l) => l.active && l.neighborhood.toLowerCase() === clean);
  if (match) return match.fee;
  return 8.0; // Taxa padrão se não encontrado
};
