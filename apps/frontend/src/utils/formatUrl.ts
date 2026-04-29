export const formatImageUrl = (path: string | null | undefined) => {
  if (!path) return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;
  
  // Otherwise, prepend the backend origin (without /api)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');
  
  // Ensure we don't have double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
