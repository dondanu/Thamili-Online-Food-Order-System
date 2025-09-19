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
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.menuItems.map((item: any) => ({
        ...item,
        id: item.id.toString()
      }));
    } else {
      throw new Error(data.message || 'Failed to fetch menu items');
    }
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
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.categories;
    } else {
      throw new Error(data.message || 'Failed to fetch categories');
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};