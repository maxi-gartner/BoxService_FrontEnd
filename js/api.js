const BASE_URL = "http://localhost:5000";

async function sendRequest(path, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: {
          code: response.status,
          message: data?.message || "Error en la API",
        },
      };
    }

    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 0,
        message: error.message || "No se pudo conectar con el backend",
      },
    };
  }
}

export async function getVehiculos() {
  return await sendRequest("/api/vehiculos");
}

export async function createVehiculo(vehiculo) {
  return await sendRequest("/api/vehiculos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vehiculo),
  });
}

export async function deleteVehiculo(id) {
  return await sendRequest(`/api/vehiculos/${id}`, {
    method: "DELETE",
  });
}

export async function updateVehiculo(id, vehiculo) {
  return await sendRequest(`/api/vehiculos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vehiculo),
  });
}
