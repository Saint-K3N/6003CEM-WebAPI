const express = require('express');
const axios = require('axios');
const { AttractionsCache, CountryCache } = require('../models');

const router = express.Router();

// Get detailed information about a specific attraction
router.get('/details/:attractionId', async (req, res) => {
    try {
        const { attractionId } = req.params;
        
        console.log('=== ATTRACTION DETAILS REQUEST ===');
        console.log('Attraction ID requested:', attractionId);
        
        // Clean the attraction ID
        const cleanAttractionId = attractionId.split(',')[0].trim();
        console.log('Cleaned attraction ID:', cleanAttractionId);
        
        // Mock detail for testing
        if (cleanAttractionId.startsWith('mock_')) {
            console.log('Returning mock data for:', cleanAttractionId);
            return res.json({
                attraction: {
                    id: cleanAttractionId,
                    name: 'Sample Attraction',
                    categories: [{ name: 'Tourist Attraction' }],
                    location: { address: 'Sample Address' },
                    rating: 8.5,
                    description: 'This is a sample attraction for testing purposes.',
                    website: 'https://example.com',
                    contact: { phone: '', email: '' },
                    photos: [
                        {
                            url: 'https://via.placeholder.com/300x200?text=Sample+Photo',
                            width: 300,
                            height: 200
                        }
                    ],
                    hours: null,
                    tips: ['This is a sample attraction for testing.', 'Great place to visit!']
                }
            });
        }
        
        const foursquareApiKey = process.env.FOURSQUARE_API_KEY;
        if (!foursquareApiKey) {
            console.log('No Foursquare API key, returning instructional mock data');
            return res.json({
                attraction: {
                    id: cleanAttractionId,
                    name: 'Attraction Details (API Key Required)',
                    categories: [{ name: 'Tourist Attraction' }],
                    location: { address: 'API key required for details' },
                    rating: 8.0,
                    description: 'Foursquare API key is required to load attraction details.',
                    website: '',
                    contact: { phone: '', email: '' },
                    photos: [],
                    hours: null,
                    tips: [
                        'Add FOURSQUARE_API_KEY to .env file to get real attraction details.',
                        'Get your free API key from: https://developer.foursquare.com/'
                    ]
                }
            });
        }

        console.log('Fetching details from Foursquare API for:', cleanAttractionId);

        // Use the correct Foursquare v3 API endpoint for place details
        const detailsUrl = `https://api.foursquare.com/v3/places/${cleanAttractionId}`;
        console.log('Foursquare URL:', detailsUrl);
        
        const response = await axios.get(detailsUrl, {
            headers: {
                'Authorization': foursquareApiKey,
                'Accept': 'application/json'
            },
            params: {
                fields: 'fsq_id,name,categories,location,rating,price,website,tel,email,photos,description,hours,tips'
            },
            timeout: 10000
        });

        const attraction = response.data;
        console.log('Foursquare API returned attraction:', attraction.name);

        // Process tips - Filter for English only
        let processedTips = [];
        if (attraction.tips && Array.isArray(attraction.tips)) {
            processedTips = attraction.tips
                .map(tip => {
                    if (typeof tip === 'string') return tip;
                    return tip.text || String(tip);
                })
                .filter(tip => {
                    if (!tip || tip.length === 0) return false;
                    // Filter for English tips (contains mostly English characters)
                    const englishRegex = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
                    const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|can|must|shall|this|that|these|those|a|an|you|I|we|they|he|she|it)\b/i;
                    
                    // Check if tip contains common English words or is mostly Latin characters
                    return englishWords.test(tip) || englishRegex.test(tip.slice(0, 50));
                })
                .slice(0, 5); // Limit to 5 tips
        }

        // Process photos
        let processedPhotos = [];
        if (attraction.photos && Array.isArray(attraction.photos)) {
            processedPhotos = attraction.photos.slice(0, 3).map(photo => ({
                url: `${photo.prefix}300x200${photo.suffix}`,
                width: 300,
                height: 200
            }));
        }

        const processedAttraction = {
            id: attraction.fsq_id,
            name: attraction.name,
            categories: attraction.categories || [],
            location: attraction.location || {},
            rating: attraction.rating || 0,
            price: attraction.price || 0,
            website: attraction.website || '',
            contact: {
                phone: attraction.tel || '',
                email: attraction.email || ''
            },
            photos: processedPhotos,
            description: attraction.description || '',
            hours: attraction.hours || null,
            tips: processedTips
        };

        console.log('Returning processed attraction details');
        res.json({
            attraction: processedAttraction
        });

    } catch (error) {
        console.error('Attraction details fetch error:', error);

        // Handle API key errors
        if (error.response && error.response.status === 401) {
            return res.json({
                attraction: {
                    id: req.params.attractionId,
                    name: 'Attraction Details (Invalid API Key)',
                    categories: [{ name: 'Tourist Attraction' }],
                    location: { address: 'Invalid or missing Foursquare API key' },
                    rating: 7.5,
                    description: 'Please check your FOURSQUARE_API_KEY in .env file.',
                    website: '',
                    contact: { phone: '', email: '' },
                    photos: [],
                    hours: null,
                    tips: ['Get your free API key from: https://developer.foursquare.com/']
                }
            });
        }

        // Always return a valid response structure
        const cleanAttractionId = req.params.attractionId.split(',')[0].trim();
        console.log('API failed, returning mock data for:', cleanAttractionId);
        
        res.json({
            attraction: {
                id: cleanAttractionId,
                name: 'Sample Attraction (Details Unavailable)',
                categories: [{ name: 'Tourist Attraction' }],
                location: { address: 'Address not available due to API error' },
                rating: 7.5,
                description: 'Details could not be loaded at this time. This is sample data.',
                website: '',
                contact: { phone: '', email: '' },
                photos: [],
                hours: null,
                tips: ['Details temporarily unavailable due to API error.', 'This is sample data for testing.']
            }
        });
    }
});

// Get attractions for a country/city using Foursquare API
router.get('/:country/:city?', async (req, res) => {
    try {
        const { country, city } = req.params;
        const { limit = 20 } = req.query;

        console.log('=== ATTRACTIONS SEARCH REQUEST ===');
        console.log('Country:', country);
        console.log('City:', city);
        console.log('Request URL:', req.originalUrl);

        const searchLocation = city ? `${city}, ${country}` : country;

        // Check cache first
        const cachedAttractions = await AttractionsCache.findOne({
            country: country.toLowerCase(),
            city: city ? city.toLowerCase() : 'all',
            expiresAt: { $gt: new Date() }
        });

        if (cachedAttractions) {
            return res.json({
                location: searchLocation,
                attractions: cachedAttractions.attractions.slice(0, parseInt(limit)),
                total: cachedAttractions.attractions.length,
                cached: true,
                lastUpdated: cachedAttractions.cachedAt
            });
        }

        // Check if we have Foursquare API key
        const foursquareApiKey = process.env.FOURSQUARE_API_KEY;
        
        if (!foursquareApiKey) {
            // Use mock data if no API key
            console.log('No Foursquare API key found, using mock data');
            const mockData = getMockAttractions(country.toLowerCase());
            
            return res.json({
                location: searchLocation,
                attractions: mockData.slice(0, parseInt(limit)),
                total: mockData.length,
                cached: false,
                note: 'Using mock data. Add FOURSQUARE_API_KEY to .env for real data.',
                setup: 'Get your free API key from: https://developer.foursquare.com/'
            });
        }

        // Use proper near parameter format for Foursquare API v3
        const baseUrl = 'https://api.foursquare.com/v3/places/search';
        const params = {
            near: searchLocation, // This should be "City, Country" format
            categories: '16000,10000,12000,13000',
            limit: Math.min(parseInt(limit), 50),
            sort: 'RATING',
            fields: 'fsq_id,name,categories,location,distance,rating,price,website,tel,email,photos,description,hours,tips'
        };

        console.log('Fetching attractions for:', searchLocation);
        console.log('Request params:', params);

        const response = await axios.get(baseUrl, {
            headers: {
                'Authorization': foursquareApiKey,
                'Accept': 'application/json'
            },
            params,
            timeout: 10000
        });

        const attractions = response.data.results || [];
        console.log(`Foursquare returned ${attractions.length} attractions`);

        // Process attraction data
        const processedAttractions = attractions.map(attraction => {
            let processedTips = [];
            if (attraction.tips && Array.isArray(attraction.tips)) {
                processedTips = attraction.tips.map(tip => {
                    if (typeof tip === 'string') return tip;
                    return tip.text || String(tip);
                }).filter(tip => tip && tip.length > 0);
            }

            return {
                fsq_id: attraction.fsq_id,
                name: attraction.name,
                categories: attraction.categories || [],
                location: {
                    address: attraction.location?.address || '',
                    locality: attraction.location?.locality || '',
                    region: attraction.location?.region || '',
                    country: attraction.location?.country || '',
                    postcode: attraction.location?.postcode || '',
                    coordinates: {
                        lat: attraction.location?.latitude || 0,
                        lng: attraction.location?.longitude || 0
                    }
                },
                distance: attraction.distance || 0,
                rating: attraction.rating || 0,
                price: attraction.price || 0,
                website: attraction.website || '',
                tel: attraction.tel || '',
                email: attraction.email || '',
                photos: attraction.photos || [],
                description: attraction.description || '',
                hours: attraction.hours || null,
                tips: processedTips
            };
        });

        // Cache the results
        const attractionsCache = new AttractionsCache({
            country: country.toLowerCase(),
            city: city ? city.toLowerCase() : 'all',
            searchQuery: searchLocation,
            attractions: processedAttractions,
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        await attractionsCache.save();

        res.json({
            location: searchLocation,
            attractions: processedAttractions,
            total: processedAttractions.length,
            cached: false,
            searchParams: {
                country,
                city: city || 'All cities',
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Attractions fetch error:', error.message);

        if (error.response) {
            console.error('Foursquare API response:', error.response.status, error.response.data);
            
            if (error.response.status === 401) {
                const { country } = req.params;
                const mockData = getMockAttractions(country.toLowerCase());
                
                return res.json({
                    location: req.params.city ? `${req.params.city}, ${country}` : country,
                    attractions: mockData.slice(0, parseInt(req.query.limit || 20)),
                    total: mockData.length,
                    cached: false,
                    error: 'Invalid Foursquare API key',
                    note: 'Using mock data. Please check your FOURSQUARE_API_KEY in .env file.',
                    setup: 'Get your free API key from: https://developer.foursquare.com/'
                });
            }
        }

        // Fallback for errors
        const { country } = req.params;
        const mockData = getMockAttractions(country.toLowerCase());
        
        res.json({
            location: req.params.city ? `${req.params.city}, ${country}` : country,
            attractions: mockData.slice(0, parseInt(req.query.limit || 20)),
            total: mockData.length,
            cached: false,
            error: 'Foursquare API error, using fallback data',
            note: error.message
        });
    }
});

// Mock attractions function
function getMockAttractions(country) {
    const mockAttractions = {
        'australia': [
            { fsq_id: 'mock_au_1', name: 'Sydney Opera House', categories: [{ name: 'Performing Arts Venue' }], location: { address: 'Sydney, Australia', coordinates: { lat: -33.8568, lng: 151.2153 } }, rating: 9.5, tips: ['Iconic architecture', 'Book tours in advance'] },
            { fsq_id: 'mock_au_2', name: 'Uluru', categories: [{ name: 'Mountain' }], location: { address: 'Northern Territory, Australia', coordinates: { lat: -25.3444, lng: 131.0369 } }, rating: 9.8, tips: ['Sacred Aboriginal site', 'Best at sunrise/sunset'] },
            { fsq_id: 'mock_au_3', name: 'Great Barrier Reef', categories: [{ name: 'Natural Feature' }], location: { address: 'Queensland, Australia', coordinates: { lat: -18.2871, lng: 147.6992 } }, rating: 9.7, tips: ['World heritage site', 'Great for snorkeling'] }
        ],
        'japan': [
            { fsq_id: 'mock_jp_1', name: 'Tokyo Tower', categories: [{ name: 'Tower' }], location: { address: 'Tokyo, Japan', coordinates: { lat: 35.6586, lng: 139.7454 } }, rating: 8.5, tips: ['Great city views', 'Visit at night for illumination'] },
            { fsq_id: 'mock_jp_2', name: 'Fushimi Inari Taisha', categories: [{ name: 'Temple' }], location: { address: 'Kyoto, Japan', coordinates: { lat: 34.9671, lng: 135.7727 } }, rating: 9.2, tips: ['Famous for thousands of torii gates', 'Early morning visit recommended'] },
            { fsq_id: 'mock_jp_3', name: 'Mount Fuji', categories: [{ name: 'Mountain' }], location: { address: 'Honshu, Japan', coordinates: { lat: 35.3606, lng: 138.7274 } }, rating: 9.8, tips: ['Iconic symbol of Japan', 'Best views from Lake Kawaguchi'] }
       ],
       'france': [
           { fsq_id: 'mock_fr_1', name: 'Eiffel Tower', categories: [{ name: 'Monument' }], location: { address: 'Paris, France', coordinates: { lat: 48.8584, lng: 2.2945 } }, rating: 9.0, tips: ['Iconic Parisian landmark', 'Beautiful at night with lights'] },
           { fsq_id: 'mock_fr_2', name: 'Louvre Museum', categories: [{ name: 'Museum' }], location: { address: 'Paris, France', coordinates: { lat: 48.8606, lng: 2.3376 } }, rating: 9.3, tips: ['Home to Mona Lisa', 'Book tickets online to avoid queues'] },
           { fsq_id: 'mock_fr_3', name: 'Palace of Versailles', categories: [{ name: 'Palace' }], location: { address: 'Versailles, France', coordinates: { lat: 48.8049, lng: 2.1204 } }, rating: 9.1, tips: ['Stunning gardens', 'Allow full day for visit'] }
       ],
       'italy': [
           { fsq_id: 'mock_it_1', name: 'Colosseum', categories: [{ name: 'Historic Site' }], location: { address: 'Rome, Italy', coordinates: { lat: 41.8902, lng: 12.4922 } }, rating: 9.2, tips: ['Ancient Roman amphitheater', 'Book skip-the-line tickets'] },
           { fsq_id: 'mock_it_2', name: 'Leaning Tower of Pisa', categories: [{ name: 'Tower' }], location: { address: 'Pisa, Italy', coordinates: { lat: 43.7230, lng: 10.3966 } }, rating: 8.7, tips: ['Famous tilted tower', 'Climb to the top for views'] },
           { fsq_id: 'mock_it_3', name: 'Venice Canals', categories: [{ name: 'Waterway' }], location: { address: 'Venice, Italy', coordinates: { lat: 45.4408, lng: 12.3155 } }, rating: 9.4, tips: ['Romantic gondola rides', 'Visit St. Marks Square'] }
       ],
       'united kingdom': [
           { fsq_id: 'mock_uk_1', name: 'Big Ben', categories: [{ name: 'Clock Tower' }], location: { address: 'London, UK', coordinates: { lat: 51.4994, lng: -0.1245 } }, rating: 8.8, tips: ['Iconic London landmark', 'Great for photos'] },
           { fsq_id: 'mock_uk_2', name: 'Tower Bridge', categories: [{ name: 'Bridge' }], location: { address: 'London, UK', coordinates: { lat: 51.5055, lng: -0.0754 } }, rating: 8.9, tips: ['Victorian Gothic bridge', 'Walk across glass floor'] },
           { fsq_id: 'mock_uk_3', name: 'Stonehenge', categories: [{ name: 'Historic Site' }], location: { address: 'Wiltshire, UK', coordinates: { lat: 51.1789, lng: -1.8262 } }, rating: 8.5, tips: ['Prehistoric stone circle', 'Audio guide recommended'] }
       ],
       'spain': [
           { fsq_id: 'mock_es_1', name: 'Sagrada Familia', categories: [{ name: 'Church' }], location: { address: 'Barcelona, Spain', coordinates: { lat: 41.4036, lng: 2.1744 } }, rating: 9.3, tips: ['Gaudí masterpiece', 'Book timed entry tickets'] },
           { fsq_id: 'mock_es_2', name: 'Alhambra', categories: [{ name: 'Palace' }], location: { address: 'Granada, Spain', coordinates: { lat: 37.1773, lng: -3.5986 } }, rating: 9.5, tips: ['Moorish palace complex', 'Advance booking essential'] },
           { fsq_id: 'mock_es_3', name: 'Park Güell', categories: [{ name: 'Park' }], location: { address: 'Barcelona, Spain', coordinates: { lat: 41.4145, lng: 2.1527 } }, rating: 8.9, tips: ['Colorful mosaic art', 'Great city views'] }
       ],
       'germany': [
           { fsq_id: 'mock_de_1', name: 'Brandenburg Gate', categories: [{ name: 'Monument' }], location: { address: 'Berlin, Germany', coordinates: { lat: 52.5163, lng: 13.3777 } }, rating: 8.7, tips: ['Symbol of German reunification', 'Free to visit'] },
           { fsq_id: 'mock_de_2', name: 'Neuschwanstein Castle', categories: [{ name: 'Castle' }], location: { address: 'Bavaria, Germany', coordinates: { lat: 47.5576, lng: 10.7498 } }, rating: 9.1, tips: ['Fairy-tale castle', 'Inspired Disney castle'] },
           { fsq_id: 'mock_de_3', name: 'Cologne Cathedral', categories: [{ name: 'Cathedral' }], location: { address: 'Cologne, Germany', coordinates: { lat: 50.9413, lng: 6.9583 } }, rating: 8.8, tips: ['Gothic architecture', 'Climb 533 steps to top'] }
       ],
       'malaysia': [
           { fsq_id: 'mock_my_1', name: 'Petronas Twin Towers', categories: [{ name: 'Skyscraper' }], location: { address: 'Kuala Lumpur, Malaysia', coordinates: { lat: 3.1579, lng: 101.7116 } }, rating: 8.6, tips: ['Iconic KL landmark', 'Sky bridge connects towers'] },
           { fsq_id: 'mock_my_2', name: 'Batu Caves', categories: [{ name: 'Cave' }], location: { address: 'Selangor, Malaysia', coordinates: { lat: 3.2379, lng: 101.6840 } }, rating: 8.3, tips: ['Hindu temple in limestone cave', '272 colorful steps to climb'] },
           { fsq_id: 'mock_my_3', name: 'George Town', categories: [{ name: 'Historic District' }], location: { address: 'Penang, Malaysia', coordinates: { lat: 5.4148, lng: 100.3292 } }, rating: 8.9, tips: ['UNESCO World Heritage site', 'Famous street art'] }
       ]
   };
   
   return mockAttractions[country] || [
       { fsq_id: 'mock_default_1', name: 'Local Museum', categories: [{ name: 'Museum' }], location: { address: `${country}`, coordinates: { lat: 0, lng: 0 } }, rating: 8.0, tips: ['Popular local attraction', 'Learn about local history'] },
       { fsq_id: 'mock_default_2', name: 'City Center', categories: [{ name: 'Plaza' }], location: { address: `${country}`, coordinates: { lat: 0, lng: 0 } }, rating: 7.5, tips: ['Heart of the city', 'Great for walking'] },
       { fsq_id: 'mock_default_3', name: 'Local Park', categories: [{ name: 'Park' }], location: { address: `${country}`, coordinates: { lat: 0, lng: 0 } }, rating: 7.8, tips: ['Perfect for relaxation', 'Family-friendly'] }
   ];
}

module.exports = router;
