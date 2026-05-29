export async function load({ fetch }) {
  try {
    const response = await fetch('/api/shop/getItems');
    const data = await response.json();
    const items = Array.isArray(data) ? data.filter((entry) => entry && typeof entry === 'object') : [];
    const sortedItems = items.sort((a, b) => (Number(a.price ?? 0) - Number(b.price ?? 0)));
    
    return {
      items: sortedItems,
      error: null
    };
  } catch (error) {
    console.error('Error loading shop items:', error);
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error while loading shop items'
    };
  }
}
