/**
 * Utility to fetch Indonesia administrative areas
 * API Source: https://github.com/emsifa/api-wilayah-indonesia
 */

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export const getProvinces = async () => {
  const res = await fetch(`${BASE_URL}/provinces.json`);
  return res.json();
};

export const getRegencies = async (provinceId: string) => {
  const res = await fetch(`${BASE_URL}/regencies/${provinceId}.json`);
  return res.json();
};

export const getDistricts = async (regencyId: string) => {
  const res = await fetch(`${BASE_URL}/districts/${regencyId}.json`);
  return res.json();
};

export const getVillages = async (districtId: string) => {
  const res = await fetch(`${BASE_URL}/villages/${districtId}.json`);
  return res.json();
};
