import api from "./api";

const login = async (identificador, password) => {
  try {
    const { data } = await api.post("/auth/login", { identificador, password });
    localStorage.setItem("token", data.token);
    return { success: true, token: data.token };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || "Error al iniciar sesión",
    };
  }
};

const register = async (userPayload) => {
  try {
    // Registrar usuario
    const { data: authData } = await api.post("/auth/register", userPayload);
    localStorage.setItem("token", authData.token);

    // Intentar obtener datos del usuario, pero no fallar el registro si esto falla
    let user = null;
    try {
      const { data } = await api.get("/auth/me");
      user = data;
    } catch (e) {
      console.warn(
        "No se pudo cargar el usuario tras registro",
        e?.response?.data || e?.message
      );
    }

    return {
      success: true,
      token: authData.token,
      user,
      message: "Registro exitoso",
    };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || "Error al registrar usuario",
    };
  }
};

const logout = () => {
  localStorage.removeItem("token");
};

const getCurrentUser = async () => {
  try {
    // Solo intentamos obtener el usuario si hay un token
    if (!localStorage.getItem("token")) {
      return null;
    }
    const { data } = await api.get("/auth/me");
    return data;
  } catch (err) {
    console.error("Error al obtener usuario actual:", err);
    // Si hay error 401, simplemente retornamos null en lugar de lanzar error
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      return null;
    }
    throw err;
  }
};

// Actualiza el perfil del usuario autenticado
const updateProfile = async (payload) => {
  try {
    const { data } = await api.put("/auth/me", payload);
    return { success: true, message: data.message };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || "Error al actualizar perfil",
    };
  }
};

// Solicita el envío del correo de verificación
const sendVerificationEmail = async () => {
  try {
    const { data } = await api.post("/auth/verify/request");
    return { success: true, message: data.message };
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.error ||
        "Error al solicitar el correo de verificación",
    };
  }
};

// Verifica la cuenta usando un token
const verifyEmail = async (token) => {
  try {
    const { data } = await api.post("/auth/verify", { token });
    return { success: true, message: data.message };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || "Error al verificar cuenta",
    };
  }
};

// Cambia la contraseña del usuario autenticado
const changePassword = async (passwordActual, passwordNueva) => {
  try {
    const { data } = await api.put("/auth/me/password", {
      passwordActual,
      passwordNueva,
    });
    return { success: true, message: data.message };
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.error || "Error al actualizar la contraseña",
    };
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
