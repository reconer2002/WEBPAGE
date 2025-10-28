// Este archivo se mantiene igual que en el paso anterior,
// ya que maneja correctamente la respuesta del backend.
import api from './api';

const login = async (identificador, password) => {
  try {
    const { data } = await api.post('/auth/login', { identificador, password });
    
    // Si el backend llega hasta aquí, asumimos que el usuario está verificado y autenticado
    localStorage.setItem('token', data.token);
    return { success: true, token: data.token };
  } catch (err) {
    // Manejo de error para verificar si la cuenta no está activa (403/401)
    const responseData = err.response?.data || {};
    const message = responseData.message || responseData.error || err.message || 'Error al iniciar sesión';
    
    // Si el backend envía canResend: true, indicamos al frontend que redirija al flujo de verificación.
    return {
      success: false,
      message,
      canResend: responseData.canResend || false,
      resendEndpoint: responseData.resendEndpoint || null,
      status: err.response?.status || null,
    };
  }
};

const logout = () => {
  localStorage.removeItem('token');
};

const getCurrentUser = async () => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (err) {
    console.error('Error al obtener usuario actual:', err);
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      return null;
    }
    throw err;
  }
};

const register = async (payload) => {
  try {
    const { data } = await api.post('/auth/register', payload);

    if (data?.token) localStorage.setItem('token', data.token);

    return { 
      success: true, 
      message: data?.message || 'Registro exitoso', 
      user: data?.user || null 
    };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al registrar usuario',
    };
  }
};

const updateProfile = async (payload) => {
  try {
    const { data } = await api.put('/auth/me', {
      nombre: payload.username, 
      email: payload.email,
      nombre_real: payload.nombre_real,
      apellido: payload.apellido,
      telefono: payload.telefono,
      direccion: payload.direccion,
      ciudad: payload.ciudad,
      region: payload.region,
      fecha_nacimiento: payload.fecha_nacimiento,
    });
    return { success: true, message: data?.message || 'Perfil actualizado' };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al actualizar perfil' };
  }
};

const sendVerificationEmail = async () => {
  try {
    const { data } = await api.post('/auth/verify/request');
    return { success: true, message: data?.message || 'Correo enviado' };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al enviar correo' };
  }
};

const verifyEmail = async (token) => {
  try {
    const { data } = await api.post('/auth/verify', { token });
    return { success: true, message: data?.message || 'Cuenta verificada', token: data?.token || null };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al verificar' };
  }
};

const changePassword = async (passwordActual, passwordNueva) => {
  try {
    const { data } = await api.put('/auth/me/password', { passwordActual, passwordNueva });
    return { success: true, message: data?.message || 'Contraseña actualizada' };
  } catch (err) {
    return { success: false, message: err.response?.data?.error || 'Error al actualizar contraseña' };
  }
};

export default {
  login,
  logout,
  getCurrentUser,
  register,
  updateProfile,
  sendVerificationEmail,
  verifyEmail,
  changePassword,
};