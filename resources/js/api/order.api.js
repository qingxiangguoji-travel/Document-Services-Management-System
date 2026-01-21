import http from './http';

export const createOrder = (data) => http.post('/business/orders', data);
export const updateOrder = (id, data) => http.put(`/business/orders/${id}`, data);
export const getOrderById = (id) => http.get(`/business/orders/${id}`);