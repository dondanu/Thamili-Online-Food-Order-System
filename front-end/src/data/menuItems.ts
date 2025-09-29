import { MenuItem } from '../contexts/OrderContext';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const fetchMenuItems = async (category?: string): Promise<MenuItem[]> => {
  try {
    const url = category ? `${API_URL}/menu?category=${category}` : `${API_URL}/menu`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    
    const data = await response.json().catch(() => ({}));
    // Support both API shapes:
    // 1) { success: true, data: { menuItems: [...] } }
    // 2) { menuItems: [...] }
    const rawItems = (data && data.success === true) ? data?.data?.menuItems : data?.menuItems;
    if (!Array.isArray(rawItems)) {
      throw new Error(data?.message || 'Failed to fetch menu items');
    }

    return rawItems.map((item: any) => ({
      ...item,
      id: item.id?.toString?.() ?? String(item.id),
      image: item.image ?? item.image_url
    }));
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
};

export const fetchCategories = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_URL}/menu/categories`, {
      headers: getAuthHeaders()
    });
    
    const data = await response.json().catch(() => ({}));
    // Support both API shapes:
    // 1) { success: true, data: { categories: [...] } }
    // 2) { categories: [...] }
    const rawCategories = (data && data.success === true) ? data?.data?.categories : data?.categories;
    if (!Array.isArray(rawCategories)) {
      throw new Error(data?.message || 'Failed to fetch categories');
    }
    return rawCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};