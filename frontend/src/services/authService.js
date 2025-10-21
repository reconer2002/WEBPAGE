import api from './api';

const login = async (identificador, password) => {
  try {
    const { data } = await api.post('/auth/login', { identificador, password });
    localStorage.setItem('token', data.token);
    return { success: true, token: data.token };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || 'Error al iniciar sesión',
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
    // Intentar cargar el usuario
    let user = null;
    try {
      const me = await api.get('/auth/me');
      user = me.data;
    } catch (_) {}
    return { success: true, message: data?.message || 'Registro exitoso', user };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || 'Error al registrar usuario',
    };
  }
};

const updateProfile = async (payload) => {
  try {
    const { data } = await api.put('/auth/me', payload);
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
    return { success: true, message: data?.message || 'Cuenta verificada' };
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
