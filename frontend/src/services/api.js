const API_URL = import.meta.env.VITE_API_URL;

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(error?.error || "Ocurrió un error en la petición");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get(endpoint) {
    return request(endpoint);
  },

  post(endpoint, data) {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  patch(endpoint, data) {
    return request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(endpoint) {
    return request(endpoint, {
      method: "DELETE",
    });
  },
};