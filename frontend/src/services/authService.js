import api from './api';

const login = async (email, password) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
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
    console.log(data);
    return data;
  } catch (err) {
    console.error('Error al obtener usuario actual:', err);
    throw err;
  }
};

export default {
  login,
  logout,
  getCurrentUser,
};
