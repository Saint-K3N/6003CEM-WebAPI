const express = require('express');
const { TravelPlan } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's travel plans
router.get('/', authenticateToken, async (req, res) => {
    try {
        const travelPlans = await TravelPlan.find({ userId: req.user.userId })
            .sort({ createdAt: -1 });
        
        res.json({
            plans: travelPlans,
            total: travelPlans.length,
            user: req.user.username
        });
        
    } catch (error) {
        console.error('Travel plans fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch travel plans',
            message: error.message
        });
    }
});

// Get specific travel plan by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const travelPlan = await TravelPlan.findOne({
            _id: id,
            userId: req.user.userId
        });
        
        if (!travelPlan) {
            return res.status(404).json({
                error: 'Travel plan not found',
                message: 'The specified travel plan does not exist or you do not have access to it'
                });
       }
       
       res.json({
           plan: travelPlan
       });
       
   } catch (error) {
       console.error('Travel plan fetch error:', error);
       
       if (error.name === 'CastError') {
           return res.status(400).json({
               error: 'Invalid ID',
               message: 'Please provide a valid travel plan ID'
           });
       }
       
       res.status(500).json({
           error: 'Failed to fetch travel plan',
           message: error.message
       });
   }
});

// Create new travel plan
router.post('/', authenticateToken, async (req, res) => {
   try {
       const {
           planName,
           country,
           description,
           selectedAttractions,
           startDate,
           endDate,
           budget,
           travelers,
           isPublic,
           tags,
           notes
       } = req.body;

       // Validation
       if (!planName || !country || !country.name || !country.code) {
           return res.status(400).json({
               error: 'Missing required fields',
               message: 'Plan name and country information are required'
           });
       }
       
       const newTravelPlan = new TravelPlan({
           userId: req.user.userId,
           planName,
           country: {
               name: country.name,
               code: country.code,
               capital: country.capital || '',
               region: country.region || '',
               flag: country.flag || ''
           },
           description: description || '',
           selectedAttractions: selectedAttractions || [],
           startDate: startDate ? new Date(startDate) : null,
           endDate: endDate ? new Date(endDate) : null,
           budget: budget || { amount: 0, currency: 'USD' },
           travelers: travelers || 1,
           isPublic: isPublic || false,
           tags: tags || [],
           notes: notes || '',
           status: 'planning'
       });
       
       const savedPlan = await newTravelPlan.save();
       
       res.status(201).json({
           message: 'Travel plan created successfully',
           plan: savedPlan
       });
       
   } catch (error) {
       console.error('Travel plan creation error:', error);
       res.status(400).json({
           error: 'Failed to create travel plan',
           message: error.message
       });
   }
});

// Update travel plan
router.put('/:id', authenticateToken, async (req, res) => {
   try {
       const { id } = req.params;
       
       // Find the travel plan
       const existingPlan = await TravelPlan.findOne({
           _id: id,
           userId: req.user.userId
       });
       
       if (!existingPlan) {
           return res.status(404).json({
               error: 'Travel plan not found',
               message: 'The specified travel plan does not exist or you do not have access to it'
           });
       }
       
       // Update the plan
       const updateData = {
           ...req.body,
           updatedAt: new Date()
       };
       
       // Don't allow changing userId
       delete updateData.userId;
       
       const updatedPlan = await TravelPlan.findByIdAndUpdate(
           id,
           updateData,
           { new: true, runValidators: true }
       );
       
       res.json({
           message: 'Travel plan updated successfully',
           plan: updatedPlan
       });
       
   } catch (error) {
       console.error('Travel plan update error:', error);
       
       if (error.name === 'CastError') {
           return res.status(400).json({
               error: 'Invalid ID',
               message: 'Please provide a valid travel plan ID'
           });
       }
       
       res.status(400).json({
           error: 'Failed to update travel plan',
           message: error.message
       });
   }
});

// Add attraction to travel plan
router.post('/:id/attractions', authenticateToken, async (req, res) => {
   try {
       const { id } = req.params;
       const { attraction } = req.body;

       if (!attraction || !attraction.attractionId || !attraction.name) {
           return res.status(400).json({
               error: 'Invalid attraction data',
               message: 'Attraction ID and name are required'
           });
       }

       const travelPlan = await TravelPlan.findOne({
           _id: id,
           userId: req.user.userId
       });

       if (!travelPlan) {
           return res.status(404).json({
               error: 'Travel plan not found',
               message: 'The specified travel plan does not exist or you do not have access to it'
           });
       }

       // Check if attraction already exists in the plan
       const existingAttraction = travelPlan.selectedAttractions.find(
           attr => attr.attractionId === attraction.attractionId
       );

       if (existingAttraction) {
           return res.status(400).json({
               error: 'Attraction already added',
               message: 'This attraction is already in your travel plan'
           });
       }

       // Add the attraction
       travelPlan.selectedAttractions.push({
           attractionId: attraction.attractionId,
           name: attraction.name,
           category: attraction.category || '',
           address: attraction.address || '',
           coordinates: attraction.coordinates || { lat: 0, lng: 0 },
           rating: attraction.rating || 0,
           priceLevel: attraction.priceLevel || 0,
           photoUrl: attraction.photoUrl || '',
           website: attraction.website || '',
           phone: attraction.phone || '',
           notes: attraction.notes || '',
           visitDate: attraction.visitDate ? new Date(attraction.visitDate) : null,
           priority: attraction.priority || 'medium',
           addedAt: new Date()
       });

       await travelPlan.save();

       res.json({
           message: 'Attraction added to travel plan successfully',
           plan: travelPlan
       });

   } catch (error) {
       console.error('Add attraction error:', error);
       res.status(500).json({
           error: 'Failed to add attraction',
           message: error.message
       });
   }
});

// Remove attraction from travel plan
router.delete('/:id/attractions/:attractionId', authenticateToken, async (req, res) => {
   try {
       const { id, attractionId } = req.params;

       const travelPlan = await TravelPlan.findOne({
           _id: id,
           userId: req.user.userId
       });

       if (!travelPlan) {
           return res.status(404).json({
               error: 'Travel plan not found',
               message: 'The specified travel plan does not exist or you do not have access to it'
           });
       }

       // Remove the attraction
       travelPlan.selectedAttractions = travelPlan.selectedAttractions.filter(
           attr => attr.attractionId !== attractionId
       );

       await travelPlan.save();

       res.json({
           message: 'Attraction removed from travel plan successfully',
           plan: travelPlan
       });

   } catch (error) {
       console.error('Remove attraction error:', error);
       res.status(500).json({
           error: 'Failed to remove attraction',
           message: error.message
       });
   }
});

// Delete travel plan
router.delete('/:id', authenticateToken, async (req, res) => {
   try {
       const { id } = req.params;
       
       const existingPlan = await TravelPlan.findOne({
           _id: id,
           userId: req.user.userId
       });
       
       if (!existingPlan) {
           return res.status(404).json({
               error: 'Travel plan not found',
               message: 'The specified travel plan does not exist or you do not have access to it'
           });
       }
       
       await TravelPlan.findByIdAndDelete(id);
       
       res.json({
           message: 'Travel plan deleted successfully',
           deletedPlan: {
               id: existingPlan._id,
               planName: existingPlan.planName
           }
       });
       
   } catch (error) {
       console.error('Travel plan deletion error:', error);
       
       if (error.name === 'CastError') {
           return res.status(400).json({
               error: 'Invalid ID',
               message: 'Please provide a valid travel plan ID'
           });
       }
       
       res.status(500).json({
           error: 'Failed to delete travel plan',
           message: error.message
       });
   }
});

module.exports = router;