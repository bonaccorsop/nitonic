import crypto from 'crypto';


export const isNumeric = (v) => new RegExp(/^([1-9]*)([0-9]*)(\.)?([0-9]*)?$/).test(v);
export const formatMoney = (amount, decimalCount = 2, decimal = '.', thousands = ',') => {
  decimalCount = Math.abs(decimalCount);
  decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

  const negativeSign = amount < 0 ? '-' : '';

  const i = parseInt((amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)), 10).toString();
  const j = i.length > 3 ? i.length % 3 : 0;

  return (
    negativeSign +
    (j ? i.substr(0, j) + thousands : '') +
    i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands) +
    (decimalCount
      ? decimal +
        Math.abs(amount - parseInt(i, 10))
          .toFixed(decimalCount)
          .slice(2)
      : '')
  );
};

export const normalizzaVAT = (vat: string): string => {
  vat = `${vat}`;
  return ('00000000000' + vat.replace(/\W/g, '')).slice(-11);
};

export const generaProgressivoInvio = (count = 10): string => {
  return crypto.randomBytes(16).toString('hex').substr(0, count);
};


