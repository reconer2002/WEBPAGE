// src/services/paginaService.js
import api from './api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const normalizeUrl = (u) => {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `${BACKEND_URL}${u}`;
};

const getFooterData = async () => {
  try {
    const response = await api.get('/pagina');
    const data = response.data;

    return {
      logo: normalizeUrl(data.logo_url),
      telefono1: data.telefono1 || '',
      telefono2: data.telefono2 || '',
      correo_contacto: data.correo_contacto || '',
      direccion: data.direccion || '',
      instagram_url: data.instagram_url || '',
    };
  } catch (error) {
    console.error('Error al obtener datos del footer:', error);
    return {
      logo: '',
      telefono1: '',
      telefono2: '',
      correo_contacto: '',
      direccion: '',
      instagram_url: '',
    };
  }
};

// --- PATCH datos generales ---
const updatePaginaData = async ({ telefono1, telefono2, correo_contacto, direccion, instagram_url }) => {
  try {
    const body = { telefono1, telefono2, correo_contacto, direccion, instagram_url };
    const response = await api.patch('/pagina', body);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar datos de la página:', error);
    throw error;
  }
};

// --- PATCH logo ---
const updateLogo = async (file) => {
  try {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.patch('/pagina/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return normalizeUrl(response.data.logo);
  } catch (error) {
    console.error('Error al actualizar logo:', error);
    throw error;
  }
};

// --- PATCH estado ---
const updateEstado = async (estado) => {
  try {
    const response = await api.patch('/pagina/estado', { estado });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar estado de la página:', error);
    throw error;
  }
};

// --- GET estado de la página ---
const getEstadoPagina = async () => {
  try {
    const response = await api.get('/pagina');
    return response.data.estado === 1; // true si activo
  } catch (err) {
    console.error('Error al obtener estado de la página:', err);
    return true; // si falla, asumimos activo
  }
};

// GET colores de la página
const getColoresPagina = async () => {
  try {
    const response = await api.get('/pagina');
    const { color1, color2, color3 } = response.data;
    return { color1, color2, color3 };
  } catch (err) {
    console.error("Error obteniendo colores", err);
    return { color1:'#ffffff', color2:'#000000', color3:'#f0f0f0' };
  }
};

// PATCH colores
const updateColoresPagina = async (colores) => {
  try {
    const response = await api.patch('/pagina', colores);
    return response.data;
  } catch(err) {
    console.error("Error actualizando colores", err);
    throw err;
  }
};

export default {
  getFooterData,
  updatePaginaData,
  updateLogo,
  updateEstado,
  getEstadoPagina,
  getColoresPagina,
  updateColoresPagina,
};