const express = require('express');
const axios = require('axios');
const { CountryCache } = require('../models');

const router = express.Router();

// Comprehensive fallback country list (keeping your existing one)
const fallbackCountries = [
    { name: 'Afghanistan', code: 'AF', capital: 'Kabul', region: 'Asia', flag: '🇦🇫', population: 38928341, coordinates: { lat: 33, lng: 65 } },
    { name: 'Albania', code: 'AL', capital: 'Tirana', region: 'Europe', flag: '🇦🇱', population: 2877800, coordinates: { lat: 41, lng: 20 } },
    { name: 'Algeria', code: 'DZ', capital: 'Algiers', region: 'Africa', flag: '🇩🇿', population: 43851043, coordinates: { lat: 28, lng: 3 } },
    { name: 'Argentina', code: 'AR', capital: 'Buenos Aires', region: 'Americas', flag: '🇦🇷', population: 45195777, coordinates: { lat: -34, lng: -64 } },
    { name: 'Australia', code: 'AU', capital: 'Canberra', region: 'Oceania', flag: '🇦🇺', population: 25499881, coordinates: { lat: -27, lng: 133 } },
    { name: 'Austria', code: 'AT', capital: 'Vienna', region: 'Europe', flag: '🇦🇹', population: 8917205, coordinates: { lat: 47.33, lng: 13.33 } },
    { name: 'Bangladesh', code: 'BD', capital: 'Dhaka', region: 'Asia', flag: '🇧🇩', population: 164689383, coordinates: { lat: 24, lng: 90 } },
    { name: 'Belgium', code: 'BE', capital: 'Brussels', region: 'Europe', flag: '🇧🇪', population: 11589616, coordinates: { lat: 50.83, lng: 4 } },
    { name: 'Brazil', code: 'BR', capital: 'Brasília', region: 'Americas', flag: '🇧🇷', population: 212559409, coordinates: { lat: -14.24, lng: -51.93 } },
    { name: 'Bulgaria', code: 'BG', capital: 'Sofia', region: 'Europe', flag: '🇧🇬', population: 6948445, coordinates: { lat: 43, lng: 25 } },
    { name: 'Cambodia', code: 'KH', capital: 'Phnom Penh', region: 'Asia', flag: '🇰🇭', population: 16718971, coordinates: { lat: 12, lng: 105 } },
    { name: 'Canada', code: 'CA', capital: 'Ottawa', region: 'Americas', flag: '🇨🇦', population: 38005238, coordinates: { lat: 60, lng: -95 } },
    { name: 'Chile', code: 'CL', capital: 'Santiago', region: 'Americas', flag: '🇨🇱', population: 19116209, coordinates: { lat: -30, lng: -71 } },
    { name: 'China', code: 'CN', capital: 'Beijing', region: 'Asia', flag: '🇨🇳', population: 1439323774, coordinates: { lat: 35, lng: 105 } },
    { name: 'Colombia', code: 'CO', capital: 'Bogotá', region: 'Americas', flag: '🇨🇴', population: 50882884, coordinates: { lat: 4, lng: -72 } },
    { name: 'Croatia', code: 'HR', capital: 'Zagreb', region: 'Europe', flag: '🇭🇷', population: 4105268, coordinates: { lat: 45.17, lng: 15.5 } },
    { name: 'Czech Republic', code: 'CZ', capital: 'Prague', region: 'Europe', flag: '🇨🇿', population: 10708982, coordinates: { lat: 49.75, lng: 15.5 } },
    { name: 'Denmark', code: 'DK', capital: 'Copenhagen', region: 'Europe', flag: '🇩🇰', population: 5792203, coordinates: { lat: 56, lng: 10 } },
    { name: 'Egypt', code: 'EG', capital: 'Cairo', region: 'Africa', flag: '🇪🇬', population: 102334403, coordinates: { lat: 27, lng: 30 } },
    { name: 'Estonia', code: 'EE', capital: 'Tallinn', region: 'Europe', flag: '🇪🇪', population: 1326539, coordinates: { lat: 59, lng: 26 } },
    { name: 'Finland', code: 'FI', capital: 'Helsinki', region: 'Europe', flag: '🇫🇮', population: 5540718, coordinates: { lat: 64, lng: 26 } },
    { name: 'France', code: 'FR', capital: 'Paris', region: 'Europe', flag: '🇫🇷', population: 65273512, coordinates: { lat: 46, lng: 2 } },
    { name: 'Germany', code: 'DE', capital: 'Berlin', region: 'Europe', flag: '🇩🇪', population: 83783945, coordinates: { lat: 51, lng: 9 } },
    { name: 'Greece', code: 'GR', capital: 'Athens', region: 'Europe', flag: '🇬🇷', population: 10423056, coordinates: { lat: 39, lng: 22 } },
    { name: 'Hungary', code: 'HU', capital: 'Budapest', region: 'Europe', flag: '🇭🇺', population: 9660350, coordinates: { lat: 47, lng: 20 } },
    { name: 'Iceland', code: 'IS', capital: 'Reykjavik', region: 'Europe', flag: '🇮🇸', population: 341250, coordinates: { lat: 65, lng: -18 } },
    { name: 'India', code: 'IN', capital: 'New Delhi', region: 'Asia', flag: '🇮🇳', population: 1380004385, coordinates: { lat: 20, lng: 77 } },
    { name: 'Indonesia', code: 'ID', capital: 'Jakarta', region: 'Asia', flag: '🇮🇩', population: 273523621, coordinates: { lat: -5, lng: 120 } },
    { name: 'Ireland', code: 'IE', capital: 'Dublin', region: 'Europe', flag: '🇮🇪', population: 4994724, coordinates: { lat: 53, lng: -8 } },
    { name: 'Israel', code: 'IL', capital: 'Jerusalem', region: 'Asia', flag: '🇮🇱', population: 8655541, coordinates: { lat: 31.5, lng: 34.75 } },
    { name: 'Italy', code: 'IT', capital: 'Rome', region: 'Europe', flag: '🇮🇹', population: 60461828, coordinates: { lat: 41.87, lng: 12.57 } },
    { name: 'Japan', code: 'JP', capital: 'Tokyo', region: 'Asia', flag: '🇯🇵', population: 126476458, coordinates: { lat: 36, lng: 138 } },
    { name: 'Jordan', code: 'JO', capital: 'Amman', region: 'Asia', flag: '🇯🇴', population: 10203140, coordinates: { lat: 31, lng: 36 } },
    { name: 'Kenya', code: 'KE', capital: 'Nairobi', region: 'Africa', flag: '🇰🇪', population: 53771300, coordinates: { lat: -1, lng: 38 } },
    { name: 'Latvia', code: 'LV', capital: 'Riga', region: 'Europe', flag: '🇱🇻', population: 1886202, coordinates: { lat: 57, lng: 25 } },
    { name: 'Lithuania', code: 'LT', capital: 'Vilnius', region: 'Europe', flag: '🇱🇹', population: 2722291, coordinates: { lat: 56, lng: 24 } },
    { name: 'Luxembourg', code: 'LU', capital: 'Luxembourg', region: 'Europe', flag: '🇱🇺', population: 625976, coordinates: { lat: 49.75, lng: 6.17 } },
    { name: 'Malaysia', code: 'MY', capital: 'Kuala Lumpur', region: 'Asia', flag: '🇲🇾', population: 32365998, coordinates: { lat: 4.21, lng: 101.98 } },
    { name: 'Mexico', code: 'MX', capital: 'Mexico City', region: 'Americas', flag: '🇲🇽', population: 128932753, coordinates: { lat: 23, lng: -102 } },
    { name: 'Morocco', code: 'MA', capital: 'Rabat', region: 'Africa', flag: '🇲🇦', population: 36910558, coordinates: { lat: 32, lng: -5 } },
    { name: 'Netherlands', code: 'NL', capital: 'Amsterdam', region: 'Europe', flag: '🇳🇱', population: 17134873, coordinates: { lat: 52.5, lng: 5.75 } },
    { name: 'New Zealand', code: 'NZ', capital: 'Wellington', region: 'Oceania', flag: '🇳🇿', population: 4822233, coordinates: { lat: -41, lng: 174 } },
    { name: 'Norway', code: 'NO', capital: 'Oslo', region: 'Europe', flag: '🇳🇴', population: 5421242, coordinates: { lat: 62, lng: 10 } },
    { name: 'Peru', code: 'PE', capital: 'Lima', region: 'Americas', flag: '🇵🇪', population: 32971846, coordinates: { lat: -10, lng: -76 } },
    { name: 'Philippines', code: 'PH', capital: 'Manila', region: 'Asia', flag: '🇵🇭', population: 109581085, coordinates: { lat: 13, lng: 122 } },
    { name: 'Poland', code: 'PL', capital: 'Warsaw', region: 'Europe', flag: '🇵🇱', population: 37846605, coordinates: { lat: 52, lng: 20 } },
    { name: 'Portugal', code: 'PT', capital: 'Lisbon', region: 'Europe', flag: '🇵🇹', population: 10305564, coordinates: { lat: 39.5, lng: -8 } },
    { name: 'Romania', code: 'RO', capital: 'Bucharest', region: 'Europe', flag: '🇷🇴', population: 19237682, coordinates: { lat: 46, lng: 25 } },
    { name: 'Russia', code: 'RU', capital: 'Moscow', region: 'Europe', flag: '🇷🇺', population: 145939579, coordinates: { lat: 60, lng: 100 } },
    { name: 'Singapore', code: 'SG', capital: 'Singapore', region: 'Asia', flag: '🇸🇬', population: 5850343, coordinates: { lat: 1.29, lng: 103.85 } },
    { name: 'Slovakia', code: 'SK', capital: 'Bratislava', region: 'Europe', flag: '🇸🇰', population: 5459642, coordinates: { lat: 48.67, lng: 19.5 } },
    { name: 'Slovenia', code: 'SI', capital: 'Ljubljana', region: 'Europe', flag: '🇸🇮', population: 2078932, coordinates: { lat: 46, lng: 15 } },
    { name: 'South Africa', code: 'ZA', capital: 'Cape Town', region: 'Africa', flag: '🇿🇦', population: 59308690, coordinates: { lat: -29, lng: 24 } },
    { name: 'South Korea', code: 'KR', capital: 'Seoul', region: 'Asia', flag: '🇰🇷', population: 51780579, coordinates: { lat: 35.91, lng: 127.77 } },
    { name: 'Spain', code: 'ES', capital: 'Madrid', region: 'Europe', flag: '🇪🇸', population: 46754783, coordinates: { lat: 40, lng: -4 } },
    { name: 'Sweden', code: 'SE', capital: 'Stockholm', region: 'Europe', flag: '🇸🇪', population: 10102163, coordinates: { lat: 60.13, lng: 18.64 } },
    { name: 'Switzerland', code: 'CH', capital: 'Bern', region: 'Europe', flag: '🇨🇭', population: 8654618, coordinates: { lat: 47.17, lng: 8.52 } },
    { name: 'Taiwan', code: 'TW', capital: 'Taipei', region: 'Asia', flag: '🇹🇼', population: 23816775, coordinates: { lat: 23.5, lng: 121 } },
    { name: 'Thailand', code: 'TH', capital: 'Bangkok', region: 'Asia', flag: '🇹🇭', population: 69799978, coordinates: { lat: 15.87, lng: 100.99 } },
    { name: 'Turkey', code: 'TR', capital: 'Ankara', region: 'Asia', flag: '🇹🇷', population: 84339067, coordinates: { lat: 38.96, lng: 35.24 } },
    { name: 'Ukraine', code: 'UA', capital: 'Kyiv', region: 'Europe', flag: '🇺🇦', population: 43733759, coordinates: { lat: 49, lng: 32 } },
    { name: 'United Arab Emirates', code: 'AE', capital: 'Abu Dhabi', region: 'Asia', flag: '🇦🇪', population: 9890400, coordinates: { lat: 24, lng: 54 } },
    { name: 'United Kingdom', code: 'GB', capital: 'London', region: 'Europe', flag: '🇬🇧', population: 67886004, coordinates: { lat: 55.38, lng: -3.44 } },
    { name: 'United States', code: 'US', capital: 'Washington D.C.', region: 'Americas', flag: '🇺🇸', population: 331002647, coordinates: { lat: 37.09, lng: -95.71 } },
    { name: 'Uruguay', code: 'UY', capital: 'Montevideo', region: 'Americas', flag: '🇺🇾', population: 3473727, coordinates: { lat: -33, lng: -56 } },
    { name: 'Venezuela', code: 'VE', capital: 'Caracas', region: 'Americas', flag: '🇻🇪', population: 28435943, coordinates: { lat: 8, lng: -66 } },
    { name: 'Vietnam', code: 'VN', capital: 'Hanoi', region: 'Asia', flag: '🇻🇳', population: 97338583, coordinates: { lat: 14.06, lng: 108.28 } }
];

// Get all countries 
router.get('/', async (req, res) => {
    try {
        // Check cache first
        const cachedCountries = await CountryCache.find({
            expiresAt: { $gt: new Date() }
        }).sort({ 'name.common': 1 });

        if (cachedCountries.length > 0) {
            return res.json({
                countries: cachedCountries.map(country => ({
                    name: country.name.common,
                    code: country.code,
                    capital: country.capital?.[0] || 'N/A',
                    region: country.region,
                    flag: country.flag,
                    population: country.population,
                    coordinates: country.coordinates
                })),
                cached: true,
                total: cachedCountries.length
            });
        }

        // Try REST Countries API with correct format
        try {
            console.log('Attempting to fetch from REST Countries API...');
            const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,flags,cca2,capital,region,population,latlng', {
                timeout: 10000 // 10 second timeout
            });
            
            const countries = response.data;
            console.log(`Successfully fetched ${countries.length} countries from API`);

            // Cache the countries
            const countryDocs = countries.map(country => ({
                name: {
                    common: country.name?.common || '',
                    official: country.name?.official || country.name?.common || ''
                },
                code: country.cca2,
                capital: country.capital || [],
                region: country.region || '',
                subregion: '',
                population: country.population || 0,
                area: 0,
                flag: country.flags?.emoji || '',
                currencies: {},
                languages: {},
                timezones: [],
                coordinates: {
                    lat: country.latlng?.[0] || 0,
                    lng: country.latlng?.[1] || 0
                },
                cachedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }));

            // Clear old cache and insert new data
            await CountryCache.deleteMany({});
            await CountryCache.insertMany(countryDocs);

            return res.json({
                countries: countries.map(country => ({
                    name: country.name?.common || '',
                    code: country.cca2,
                    capital: country.capital?.[0] || 'N/A',
                    region: country.region || '',
                    flag: country.flags?.emoji || '',
                    population: country.population || 0,
                    coordinates: {
                        lat: country.latlng?.[0] || 0,
                        lng: country.latlng?.[1] || 0
                    }
                })).sort((a, b) => a.name.localeCompare(b.name)),
                cached: false,
                total: countries.length,
                source: 'REST Countries API'
            });

        } catch (apiError) {
            console.log('REST Countries API failed, using fallback data:', apiError.message);
            
            // Use fallback data if API fails
            return res.json({
                countries: fallbackCountries.sort((a, b) => a.name.localeCompare(b.name)),
                cached: false,
                total: fallbackCountries.length,
                source: 'Fallback data (API unavailable)',
                note: 'Using built-in country list due to API issues'
            });
        }

    } catch (error) {
        console.error('Countries route error:', error.message);
        
        // Final fallback
        res.json({
            countries: fallbackCountries.sort((a, b) => a.name.localeCompare(b.name)),
            cached: false,
            total: fallbackCountries.length,
            source: 'Emergency fallback',
            note: 'Using emergency fallback country list'
        });
    }
});

// Get specific country details (keeping existing code)
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const upperCode = code.toUpperCase();

        // Check cache first
        const cachedCountry = await CountryCache.findOne({
            code: upperCode,
            expiresAt: { $gt: new Date() }
        });

        if (cachedCountry) {
            return res.json({
                country: cachedCountry,
                cached: true
            });
        }

        // Try to find in fallback data
        const fallbackCountry = fallbackCountries.find(c => c.code === upperCode);
        if (fallbackCountry) {
            return res.json({
                country: {
                    name: {
                        common: fallbackCountry.name,
                        official: fallbackCountry.name
                    },
                    code: fallbackCountry.code,
                    capital: [fallbackCountry.capital],
                    region: fallbackCountry.region,
                    population: fallbackCountry.population,
                    flag: fallbackCountry.flag,
                    coordinates: fallbackCountry.coordinates
                },
                cached: false,
                source: 'Fallback data'
            });
        }

        return res.status(404).json({
            error: 'Country not found',
            message: 'The specified country code does not exist'
        });

    } catch (error) {
        console.error('Country fetch error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch country',
            message: 'Unable to fetch country data at the moment'
        });
    }
});

module.exports = router;