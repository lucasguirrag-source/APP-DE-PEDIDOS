// Gerador de número de pedido sequencial diário:
// Cada dia começa com um número aleatório entre 7 e 15 (inclusive)
// Ao longo do dia, segue progredindo (+1 a cada pedido).
// Cada novo dia, sorteia novamente um número inicial entre 7 e 15.

const STORAGE_DATE_KEY = 'aqf_order_seed_date';
const STORAGE_NUM_KEY = 'aqf_order_seed_current_num';

export const getNextOrderNumber = (): number => {
  const todayKey = new Date().toISOString().split('T')[0]; // Ex: "2026-09-23"
  const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
  const savedNum = localStorage.getItem(STORAGE_NUM_KEY);

  if (savedDate === todayKey && savedNum) {
    const nextVal = parseInt(savedNum, 10) + 1;
    localStorage.setItem(STORAGE_NUM_KEY, nextVal.toString());
    return nextVal;
  } else {
    // Novo dia: sorteia um número aleatório entre 7 e 15
    const randomStart = Math.floor(Math.random() * (15 - 7 + 1)) + 7;
    localStorage.setItem(STORAGE_DATE_KEY, todayKey);
    localStorage.setItem(STORAGE_NUM_KEY, randomStart.toString());
    return randomStart;
  }
};

export const peekCurrentOrderNumber = (): number => {
  const todayKey = new Date().toISOString().split('T')[0];
  const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
  const savedNum = localStorage.getItem(STORAGE_NUM_KEY);

  if (savedDate === todayKey && savedNum) {
    return parseInt(savedNum, 10);
  }
  const randomStart = Math.floor(Math.random() * (15 - 7 + 1)) + 7;
  localStorage.setItem(STORAGE_DATE_KEY, todayKey);
  localStorage.setItem(STORAGE_NUM_KEY, randomStart.toString());
  return randomStart;
};
