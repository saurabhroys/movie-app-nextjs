'use server';

export async function getGemmaDomain(): Promise<string> {
  try {
    const res = await fetch('https://allmovieland.link/player.js', {
      next: { revalidate: 3600 }, // cache for 1 hour
    });
    
    if (!res.ok) {
      return 'https://slast430did.com';
    }

    const text = await res.text();
    const match = text.match(/const\s+AwsIndStreamDomain\s*=\s*['"]([^'"]+)['"]/);
    // console.log('Fetched Gemma domain:', match ? match[1] : 'not found');
    if (match && match[1]) {
      return match[1];
    }
    
    return 'https://slast430did.com';
  } catch (error) {
    console.error('Failed to fetch Gemma domain:', error);
    return 'https://slast430did.com'; // fallback
  }
}
