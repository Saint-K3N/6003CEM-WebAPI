const express = require('express');
const { TravelPlan } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user destinations (from travel plans)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const travelPlans = await TravelPlan.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .select('planName country selectedAttractions createdAt');
        
        // Transform travel plans into destination format for the frontend
        const destinations = travelPlans.map(plan => ({
            _id: plan._id,
            name: plan.planName,
            country: plan.country.name,
            countryCode: plan.country.code,
            flag: plan.country.flag,
            region: plan.country.region,
            attractionsCount: plan.selectedAttractions ? plan.selectedAttractions.length : 0,
            createdAt: plan.createdAt,
            // Use country coordinates if available, otherwise use default
            latitude: plan.country.coordinates ? plan.country.coordinates.lat : 0,
            longitude: plan.country.coordinates ? plan.country.coordinates.lng : 0
        }));
        
        res.json(destinations);
    } catch (error) {
        console.error('Get destinations error:', error);
        res.status(500).json({
            error: 'Failed to fetch destinations',
            message: error.message
        });
    }
});

// Add destination (create a new travel plan)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, country, latitude, longitude, description } = req.body;

        if (!name || !country) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Name and country are required'
            });
        }

        // Check if a travel plan with this name already exists for this user
        const existingPlan = await TravelPlan.findOne({
            userId: req.user.userId,
            planName: name.trim()
        });

        if (existingPlan) {
            return res.status(400).json({
                error: 'Travel plan already exists',
                message: 'You already have a travel plan with this name'
            });
        }

        // Create a new travel plan as a destination
        const newTravelPlan = new TravelPlan({
            userId: req.user.userId,
            planName: name.trim(),
            country: {
                name: country,
                code: '', // Will be filled if country object is provided
                capital: '',
                region: '',
                flag: ''
            },
            description: description || '',
            selectedAttractions: [],
            travelers: 1,
            isPublic: false,
            tags: [],
            notes: '',
            status: 'planning'
        });

        // If country is an object with more details, use them
        if (typeof country === 'object') {
            newTravelPlan.country = {
                name: country.name,
                code: country.code || '',
                capital: country.capital || '',
                region: country.region || '',
                flag: country.flag || '',
                coordinates: {
                    lat: latitude || country.coordinates?.lat || 0,
                    lng: longitude || country.coordinates?.lng || 0
                }
            };
        } else {
            // If just a string, set coordinates if provided
            if (latitude && longitude) {
                newTravelPlan.country.coordinates = {
                    lat: parseFloat(latitude),
                    lng: parseFloat(longitude)
                };
            }
        }

        const savedPlan = await newTravelPlan.save();

        // Return in destination format
        const destination = {
            _id: savedPlan._id,
            name: savedPlan.planName,
            country: savedPlan.country.name,
            countryCode: savedPlan.country.code,
            flag: savedPlan.country.flag,
            region: savedPlan.country.region,
            attractionsCount: 0,
            createdAt: savedPlan.createdAt,
            latitude: savedPlan.country.coordinates?.lat || 0,
            longitude: savedPlan.country.coordinates?.lng || 0
        };

        res.status(201).json({
            message: 'Destination added successfully',
            destination
        });
    } catch (error) {
        console.error('Add destination error:', error);
        if (error.code === 11000) {
            res.status(400).json({
                error: 'Travel plan already exists',
                message: 'You already have a travel plan with this name'
            });
        } else {
            res.status(500).json({
                error: 'Failed to add destination',
                message: error.message
            });
        }
    }
});

// Update destination (update travel plan basic info)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const travelPlan = await TravelPlan.findOne({
            _id: id,
            userId: req.user.userId
        });

        if (!travelPlan) {
            return res.status(404).json({
                error: 'Destination not found',
                message: 'Destination not found or you do not have permission to update it'
            });
        }

        // Update basic info
        if (name) travelPlan.planName = name.trim();
        if (description !== undefined) travelPlan.description = description;

        const updatedPlan = await travelPlan.save();

        // Return in destination format
        const destination = {
            _id: updatedPlan._id,
            name: updatedPlan.planName,
            country: updatedPlan.country.name,
            countryCode: updatedPlan.country.code,
            flag: updatedPlan.country.flag,
            region: updatedPlan.country.region,
            attractionsCount: updatedPlan.selectedAttractions ? updatedPlan.selectedAttractions.length : 0,
            createdAt: updatedPlan.createdAt,
            latitude: updatedPlan.country.coordinates?.lat || 0,
            longitude: updatedPlan.country.coordinates?.lng || 0
        };

        res.json({
            message: 'Destination updated successfully',
            destination
        });
    } catch (error) {
        console.error('Update destination error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'Invalid ID',
                message: 'Please provide a valid destination ID'
            });
        }
        res.status(500).json({
            error: 'Failed to update destination',
            message: error.message
        });
    }
});

// Remove destination (delete travel plan)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const travelPlan = await TravelPlan.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!travelPlan) {
            return res.status(404).json({
                error: 'Destination not found',
                message: 'Destination not found or you do not have permission to delete it'
            });
        }

        res.json({
            message: 'Destination removed successfully',
            deletedDestination: {
                id: travelPlan._id,
                name: travelPlan.planName
            }
        });
    } catch (error) {
        console.error('Remove destination error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'Invalid ID',
                message: 'Please provide a valid destination ID'
            });
        }
        res.status(500).json({
            error: 'Failed to remove destination',
            message: error.message
        });
    }
});

// Get destination weather (for travel plan location)
router.get('/:id/weather', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const travelPlan = await TravelPlan.findOne({
            _id: id,
            userId: req.user.userId
        });

        if (!travelPlan) {
            return res.status(404).json({
                error: 'Destination not found',
                message: 'Destination not found or you do not have permission to access it'
            });
        }

        // Redirect to weather API with country/city info
        const countryName = travelPlan.country.name;
        const capital = travelPlan.country.capital;

        res.json({
            message: 'Use weather API endpoint',
            suggestion: `GET /api/weather/${capital || countryName}`,
            destination: {
                name: travelPlan.planName,
                country: countryName,
                capital: capital
            }
        });
    } catch (error) {
        console.error('Get destination weather error:', error);
        res.status(500).json({
            error: 'Failed to get destination weather info',
            message: error.message
        });
    }
});

module.exports = router;