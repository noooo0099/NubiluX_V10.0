// Fallback API responses for when Laravel backend is not available
// This prevents unhandled promise rejections during development

export const fallbackResponses = {
  '/products': [
    {
      id: 1,
      title: 'ML Mythic Account - 50 Skins',
      description: 'Akun Mobile Legends rank Mythic dengan 50+ skin hero premium.',
      category: 'MOBA',
      price: 150000,
      thumbnail: 'https://via.placeholder.com/300x200',
      rating: 4.8,
      seller: { username: 'gamer123', display_name: 'Pro Gamer' }
    },
    {
      id: 2,
      title: 'PUBG Mobile Conqueror Account',
      description: 'Akun PUBG Mobile rank Conqueror dengan outfit rare.',
      category: 'Battle Royale',
      price: 200000,
      thumbnail: 'https://via.placeholder.com/300x200',
      rating: 4.9,
      seller: { username: 'gamer123', display_name: 'Pro Gamer' }
    }
  ],
  '/auth/me': null, // Not authenticated
  '/chats': [],
  '/transactions': [],
  '/status-updates': []
};

export function getFallbackResponse(endpoint: string) {
  const key = endpoint.replace('/api', '');
  return fallbackResponses[key as keyof typeof fallbackResponses] || [];
}