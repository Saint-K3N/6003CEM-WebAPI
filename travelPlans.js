// Travel Plans Management JavaScript

let selectedAttractions = [];
let currentCountry = null;
let allAttractions = [];

async function loadTravelPlans() {
    if (!authToken) {
        console.log('No auth token, skipping travel plans load');
        return;
    }

    try {
        const plans = await apiRequest('/travel-plans');
        displayTravelPlans(plans.plans || []);
        updateTravelPlansCount(plans.plans?.length || 0);
    } catch (error) {
        console.error('Failed to load travel plans:', error);
        showToast('Failed to load travel plans', 'error');
    }
}

function displayTravelPlans(plans) {
    const container = document.getElementById('travelPlansList');
    
    if (!container) {
        console.error('Travel plans container not found');
        return;
    }
    
    if (plans.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map"></i>
                <h3>No travel plans yet</h3>
                <p>Create your first travel plan to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = plans.map(plan => `
        <div class="travel-plan-card">
            <div class="plan-header">
                <div>
                    <div class="plan-title">
                        <span class="plan-flag">${plan.country?.flag || '🌍'}</span>
                        ${plan.planName}
                    </div>
                    <div class="plan-country">${plan.country?.name || 'Unknown'}</div>
                </div>
                <div class="plan-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewTravelPlan('${plan._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTravelPlan('${plan._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="plan-stats">
                <div class="stat-item">
                    <div class="stat-number">${plan.selectedAttractions?.length || 0}</div>
                    <div class="stat-label">Attractions</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${plan.travelers || 1}</div>
                    <div class="stat-label">Travelers</div>
                </div>
            </div>
            
            ${plan.description ? `<div class="plan-description">${plan.description}</div>` : ''}
            
            <div class="plan-dates">
                <span><strong>Created:</strong> ${new Date(plan.createdAt).toLocaleDateString()}</span>
                <span class="plan-status ${plan.status}">${plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}</span>
            </div>
        </div>
    `).join('');
}

async function loadCountries() {
    try {
        showLoading();
        const response = await apiRequest('/countries');
        const countries = response.countries;
        
        const countrySelect = document.getElementById('countrySelect');
        if (!countrySelect) {
            console.error('Country select element not found');
            return;
        }
        
        countrySelect.innerHTML = '<option value="">Choose a country...</option>';
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = JSON.stringify({
                name: country.name,
                code: country.code,
                capital: country.capital,
                region: country.region,
                flag: country.flag,
                coordinates: country.coordinates
            });
            option.textContent = `${country.flag} ${country.name}`;
            countrySelect.appendChild(option);
        });
        
        console.log(`Loaded ${countries.length} countries`);
        
    } catch (error) {
        console.error('Failed to load countries:', error);
        showToast('Failed to load countries', 'error');
    } finally {
        hideLoading();
    }
}

function goToStep2() {
    console.log('=== goToStep2 function called ===');
    
    const planName = document.getElementById('planName').value;
    const countrySelect = document.getElementById('countrySelect');
    
    console.log('Plan name:', planName);
    console.log('Country select value:', countrySelect?.value);
    
    if (!planName || planName.trim().length === 0) {
        console.log('Plan name validation failed');
        showToast('Please enter a plan name', 'error');
        return;
    }
    
    if (!countrySelect?.value) {
        console.log('Country selection validation failed');
        showToast('Please select a country', 'error');
        return;
    }
    
    try {
        currentCountry = JSON.parse(countrySelect.value);
        console.log('Parsed country:', currentCountry);
        
        // ENSURE we have a proper country name
        if (!currentCountry.name) {
            console.error('Country object missing name property');
            showToast('Invalid country selection', 'error');
            return;
        }
        
        // Find the step elements
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        
        console.log('Step 1 element:', step1);
        console.log('Step 2 element:', step2);
        
        if (!step1 || !step2) {
            console.error('Step elements not found!');
            showToast('Modal step elements not found', 'error');
            return;
        }
        
        // Hide step 1, show step 2
        step1.classList.remove('active');
        step2.classList.add('active');
        
        console.log('Step 1 classes after:', step1.className);
        console.log('Step 2 classes after:', step2.className);
        
        // Reset attractions
        selectedAttractions = [];
        updateSelectedAttractionsList();
        
        // Clear previous attractions
        const attractionsList = document.getElementById('attractionsList');
        if (attractionsList) {
            attractionsList.innerHTML = '';
        }
        
        showToast(`Ready to select attractions for ${currentCountry.name}!`, 'success');
        console.log('=== goToStep2 completed successfully ===');
        
    } catch (error) {
        console.error('Error in goToStep2:', error);
        showToast('Error processing country selection: ' + error.message, 'error');
    }
}

function goToStep1() {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    
    if (step1 && step2) {
        step2.classList.remove('active');
        step1.classList.add('active');
    }
}

async function loadAttractions() {
    console.log('=== DEBUG loadAttractions ===');
    console.log('currentCountry:', currentCountry);
    console.log('typeof currentCountry:', typeof currentCountry);
    console.log('currentCountry.name:', currentCountry?.name);
    console.log('currentCountry keys:', currentCountry ? Object.keys(currentCountry) : 'null');
    console.log('============================');
    if (!currentCountry) {
        showToast('Please select a country first', 'error');
        return;
    }
    
    const city = document.getElementById('cityFilter')?.value?.trim() || '';
    const loadingDiv = document.querySelector('.attractions-loading');
    const attractionsList = document.getElementById('attractionsList');
    
    try {
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (attractionsList) attractionsList.innerHTML = '';
        
        //Use country name instead of any potential ID
        const countryName = currentCountry.name || currentCountry; // Ensure we use the country name
        
        const endpoint = city 
            ? `/attractions/${encodeURIComponent(countryName)}/${encodeURIComponent(city)}`
            : `/attractions/${encodeURIComponent(countryName)}`;
            
        console.log('Loading attractions from:', endpoint);
        console.log('Current country object:', currentCountry);
        console.log('Using country name:', countryName);
        
        const response = await apiRequest(endpoint);
        allAttractions = response.attractions || [];
        
        console.log('Loaded attractions:', allAttractions.length);
        
        if (allAttractions.length === 0) {
            if (attractionsList) {
                attractionsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No attractions found</h3>
                        <p>Try searching for a different city or check the country name.</p>
                    </div>
                `;
            }
            return;
        }
        
        displayAttractions(allAttractions);
        
    } catch (error) {
        console.error('Failed to load attractions:', error);
        showToast('Failed to load attractions: ' + error.message, 'error');
        if (attractionsList) {
            attractionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading attractions</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    } finally {
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

function displayAttractions(attractions) {
    const attractionsList = document.getElementById('attractionsList');
    
    if (!attractionsList) {
        console.error('Attractions list element not found');
        return;
    }
    
    if (!attractions || attractions.length === 0) {
        attractionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No attractions found</h3>
                <p>Try searching for a different city or check the country name.</p>
            </div>
        `;
        return;
    }
    
    attractionsList.innerHTML = attractions.map(attraction => {
        const isSelected = selectedAttractions.some(sel => sel.attractionId === attraction.fsq_id);
        const category = attraction.categories?.[0]?.name || 'Attraction';
        
        // Fix the rating calculation to prevent negative values
        const rating = Math.max(0, Math.min(10, attraction.rating || 0));
        const normalizedRating = rating / 2; // Convert 0-10 scale to 0-5 scale
        const fullStars = Math.max(0, Math.floor(normalizedRating));
        const emptyStars = Math.max(0, 5 - fullStars);
        const stars = '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
        
        return `
            <div class="attraction-item">
                <div class="attraction-info">
                    <div class="attraction-name">${attraction.name}</div>
                    <div class="attraction-category">${category}</div>
                    <div class="attraction-address">${attraction.location?.address || 'Address not available'}</div>
                    ${rating > 0 ? `
                        <div class="attraction-rating">
                            <span class="attraction-stars">${stars}</span>
                            <span>(${rating.toFixed(1)}/10)</span>
                        </div>
                    ` : ''}
                </div>
                <div class="attraction-actions">
                    <button class="btn btn-primary btn-add-attraction ${isSelected ? 'btn-outline' : ''}" 
                            onclick="${isSelected ? `removeFromSelection('${attraction.fsq_id}')` : `addToSelection('${attraction.fsq_id}')`}">
                        <i class="fas ${isSelected ? 'fa-minus' : 'fa-plus'}"></i>
                        ${isSelected ? 'Remove' : 'Add'}
                    </button>
                    <button class="btn btn-view-details" onclick="viewAttractionDetails('${attraction.fsq_id}')">
                        <i class="fas fa-info"></i> Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function addToSelection(attractionId) {
    const attraction = allAttractions.find(attr => attr.fsq_id === attractionId);
    if (!attraction) return;
    
    const selectedAttraction = {
        attractionId: attraction.fsq_id,
        name: attraction.name,
        category: attraction.categories?.[0]?.name || 'Attraction',
        address: attraction.location?.address || '',
        coordinates: {
            lat: attraction.location?.coordinates?.lat || 0,
            lng: attraction.location?.coordinates?.lng || 0
        },
        rating: attraction.rating || 0,
        priceLevel: attraction.price || 0,
        photoUrl: attraction.photos?.[0] ? `${attraction.photos[0].prefix}300x200${attraction.photos[0].suffix}` : '',
        website: attraction.website || '',
        phone: attraction.tel || ''
    };
    
    selectedAttractions.push(selectedAttraction);
    updateSelectedAttractionsList();
    displayAttractions(allAttractions);
    showToast(`Added ${attraction.name} to your plan!`, 'success');
}

function removeFromSelection(attractionId) {
    const attraction = selectedAttractions.find(attr => attr.attractionId === attractionId);
    selectedAttractions = selectedAttractions.filter(attr => attr.attractionId !== attractionId);
    updateSelectedAttractionsList();
    displayAttractions(allAttractions);
    if (attraction) {
        showToast(`Removed ${attraction.name} from your plan`, 'info');
    }
}

function updateSelectedAttractionsList() {
    const container = document.getElementById('selectedAttractionsContainer');
    const countSpan = document.getElementById('selectedCount');
    
    if (countSpan) countSpan.textContent = selectedAttractions.length;
    
    if (!container) return;
    
    if (selectedAttractions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">No attractions selected yet</p>';
        return;
    }
    
    container.innerHTML = selectedAttractions.map(attraction => `
        <div class="selected-attraction-item">
            <span class="selected-attraction-name">${attraction.name}</span>
            <button class="btn-remove-attraction" onclick="removeFromSelection('${attraction.attractionId}')">
                <i class="fas fa-times"></i> Remove
            </button>
        </div>
    `).join('');
}

// MAIN ATTRACTION DETAILS FUNCTION - This is the one that should be used
async function viewAttractionDetails(attractionId) {
    try {
        console.log('=== VIEW ATTRACTION DETAILS ===');
        console.log('Requesting details for attraction ID:', attractionId);
        
        // Clean the attraction ID
        const cleanAttractionId = attractionId.split(',')[0].trim();
        console.log('Cleaned attraction ID:', cleanAttractionId);
        
        showLoading();
        
        // Make sure we're calling the details endpoint
        const endpoint = `/attractions/details/${cleanAttractionId}`;
        console.log('API endpoint:', endpoint);
        
        const response = await apiRequest(endpoint);
        console.log('API response received:', response);
        
        // Check if we got a valid response structure
        if (!response || !response.attraction) {
            throw new Error('No attraction data in response');
        }
        
        const attraction = response.attraction;
        console.log('Successfully loaded attraction:', attraction.name);
        
        // IMPORTANT: Call the new modal function instead of showToast
        showAttractionDetailsModal(attraction);
        
    } catch (error) {
        console.error('Failed to load attraction details:', error);
        
        // Show error in the new modal format
        showAttractionDetailsModal({
            name: 'Details Unavailable',
            description: `Sorry, we couldn't load the details for this attraction. Error: ${error.message}`,
            photos: [],
            categories: [{ name: 'Error' }],
            location: { address: 'N/A' },
            rating: 0,
            website: '',
            contact: { phone: '', email: '' },
            tips: ['Please try again later or check your internet connection.']
        });
    } finally {
        hideLoading();
    }
}

function showAttractionDetailsModal(attraction) {
    console.log('=== SHOWING ATTRACTION DETAILS MODAL ===');
    console.log('Attraction data:', attraction);
    
    // Remove existing modal if any
    const existingModal = document.getElementById('attractionDetailsModal');
    if (existingModal) {
        existingModal.remove();
        console.log('Removed existing modal');
    }
    
    // Create photos HTML
    let photosHtml = '';
    if (attraction.photos && attraction.photos.length > 0) {
        console.log('Processing photos:', attraction.photos.length);
        photosHtml = `
            <div class="attraction-detail-section">
                <h4>Photos</h4>
                <div class="attraction-photos">
                    ${attraction.photos.map((photo, index) => `
                        <div class="attraction-photo">
                            <img src="${photo.url || photo}" alt="${attraction.name}" 
                                 onerror="this.parentElement.innerHTML='<div class=\\'attraction-invalid-photo\\'>Invalid Picture</div>'"
                                 onload="console.log('Photo ${index + 1} loaded successfully')">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        console.log('No photos available, showing placeholder');
        photosHtml = `
            <div class="attraction-detail-section">
                <h4>Photos</h4>
                <div class="attraction-photos">
                    <div class="attraction-photo">
                        <div class="attraction-invalid-photo">
                            <i class="fas fa-image" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><br>
                            Invalid Picture
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Create rating stars
    const rating = attraction.rating || 0;
    const normalizedRating = rating / 2; // Convert 0-10 to 0-5 scale
    const fullStars = Math.floor(normalizedRating);
    const emptyStars = 5 - fullStars;
    const stars = '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
    
    // Create the modal HTML
    const modalHtml = `
        <div id="attractionDetailsModal" class="attraction-details-modal">
            <div class="attraction-details-content">
                <div class="attraction-details-header">
                    <h2>${attraction.name}</h2>
                    <button class="attraction-details-close" onclick="closeAttractionDetailsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="attraction-details-body">
                    ${photosHtml}
                    
                    <div class="attraction-detail-section">
                        <h4>Basic Information</h4>
                        <p><strong>Categories:</strong> ${attraction.categories?.map(cat => cat.name).join(', ') || 'N/A'}</p>
                        <p><strong>Address:</strong> ${attraction.location?.address || 'Not available'}</p>
                        ${rating > 0 ? `
                            <p><strong>Rating:</strong> 
                                <span class="attraction-rating-display">
                                    <span class="attraction-rating-stars">${stars}</span>
                                    ${rating.toFixed(1)}/10
                                </span>
                            </p>
                        ` : ''}
                        ${attraction.contact?.phone ? `<p><strong>Phone:</strong> ${attraction.contact.phone}</p>` : ''}
                        ${attraction.contact?.email ? `<p><strong>Email:</strong> ${attraction.contact.email}</p>` : ''}
                    </div>
                    
                    ${attraction.description ? `
                        <div class="attraction-detail-section">
                            <h4>Description</h4>
                            <p>${attraction.description}</p>
                        </div>
                    ` : ''}
                    
                    ${attraction.website ? `
                        <div class="attraction-detail-section">
                            <h4>Website</h4>
                            <a href="${attraction.website}" target="_blank" class="attraction-website-link">
                                <i class="fas fa-external-link-alt"></i> Visit Website
                            </a>
                        </div>
                    ` : ''}
                    
                    ${attraction.tips && attraction.tips.length > 0 ? `
                        <div class="attraction-detail-section">
                            <h4>Tips & Reviews</h4>
                            <ul>
                                ${attraction.tips.map(tip => `<li>${tip}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="attraction-detail-section">
                        <p><small><strong>Attraction ID:</strong> ${attraction.id}</small></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    console.log('Adding modal to page');
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show the modal
    const modal = document.getElementById('attractionDetailsModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('Modal displayed successfully');
    } else {
        console.error('Failed to find modal after creation');
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAttractionDetailsModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeAttractionDetailsModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

function closeAttractionDetailsModal() {
    console.log('Closing attraction details modal');
    const modal = document.getElementById('attractionDetailsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
        console.log('Modal closed and removed');
    }
}

async function saveTravelPlan() {
    const planName = document.getElementById('planName')?.value?.trim();
    const description = document.getElementById('planDescription')?.value?.trim();
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    if (!planName || !currentCountry) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (selectedAttractions.length === 0) {
        if (!confirm('You haven\'t selected any attractions. Do you want to create the plan anyway?')) {
            return;
        }
    }
    
    try {
        showLoading();
        
        const planData = {
            planName,
            country: currentCountry,
            description: description || '',
            selectedAttractions,
            startDate: startDate || null,
            endDate: endDate || null,
            travelers: 1,
            isPublic: false,
            tags: [],
            notes: ''
        };
        
        await apiRequest('/travel-plans', {
            method: 'POST',
            body: JSON.stringify(planData)
        });
        
        showToast('Travel plan created successfully!', 'success');
        closeModal('createPlanModal');
        resetPlanCreation();
        loadTravelPlans();
        
    } catch (error) {
        console.error('Failed to create travel plan:', error);
        showToast('Failed to create travel plan: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function resetPlanCreation() {
    // Reset form
    const basicForm = document.getElementById('basicInfoForm');
    if (basicForm) basicForm.reset();
    
    // Reset steps
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    
    if (step1 && step2) {
        step2.classList.remove('active');
        step1.classList.add('active');
    }
    
    // Reset variables
    selectedAttractions = [];
    currentCountry = null;
    allAttractions = [];
    
    // Clear attractions list
    const attractionsList = document.getElementById('attractionsList');
    if (attractionsList) attractionsList.innerHTML = '';
    
    updateSelectedAttractionsList();
}

async function viewTravelPlan(planId) {
    try {
        showLoading();
        const response = await apiRequest(`/travel-plans/${planId}`);
        const plan = response.plan;
        
        if (!plan) {
            throw new Error('Travel plan not found');
        }
        
        document.getElementById('viewPlanTitle').textContent = plan.planName;
        
        const viewContent = document.getElementById('viewPlanContent');
        viewContent.innerHTML = `
            <div class="plan-view-header">
                <span class="plan-view-flag">${plan.country?.flag || '🌍'}</span>
                <div class="plan-view-info">
                    <h2>${plan.planName}</h2>
                    <div class="plan-view-country">${plan.country?.name || 'Unknown Country'}</div>
                    <div class="plan-meta">
                        <span class="plan-status ${plan.status}">${plan.status?.charAt(0).toUpperCase() + plan.status?.slice(1) || 'Planning'}</span>
                        ${plan.travelers ? ` • ${plan.travelers} traveler${plan.travelers > 1 ? 's' : ''}` : ''}
                        ${plan.startDate && plan.endDate ? ` • ${new Date(plan.startDate).toLocaleDateString()} to ${new Date(plan.endDate).toLocaleDateString()}` : ''}
                    </div>
                </div>
            </div>
            
            ${plan.description ? `
                <div class="plan-view-description">
                    <h3>Description</h3>
                    <p>${plan.description}</p>
                </div>
            ` : ''}
            
            <div class="plan-attractions-section">
                <h3>Selected Attractions <span class="attraction-count">(${plan.selectedAttractions?.length || 0})</span></h3>
                
                ${plan.selectedAttractions && plan.selectedAttractions.length > 0 ? 
                    plan.selectedAttractions.map((attraction, index) => `
                        <div class="plan-attraction-item">
                            <div class="attraction-number">${index + 1}</div>
                            <div class="plan-attraction-info">
                                <div class="plan-attraction-name">${attraction.name}</div>
                                <div class="plan-attraction-details">
                                    <span class="attraction-category">${attraction.category || 'Attraction'}</span>
                                    ${attraction.address ? ` • ${attraction.address}` : ''}
                                    ${attraction.rating > 0 ? ` • Rating: ${attraction.rating}/10` : ''}
                                </div>
                                ${attraction.notes ? `<div class="attraction-notes"><strong>Notes:</strong> ${attraction.notes}</div>` : ''}
                                ${attraction.visitDate ? `<div class="visit-date"><strong>Planned visit:</strong> ${new Date(attraction.visitDate).toLocaleDateString()}</div>` : ''}
                            </div>
                            <div class="plan-attraction-actions">
                                ${attraction.website ? `<a href="${attraction.website}" target="_blank" class="btn btn-outline btn-sm">Website</a>` : ''}
                                <button class="btn btn-primary btn-sm" onclick="viewAttractionDetails('${attraction.attractionId}')">
                                    <i class="fas fa-info"></i> Details
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="removeAttractionFromPlan('${planId}', '${attraction.attractionId}')">
                                    <i class="fas fa-trash"></i> Remove
                                </button>
                            </div>
                        </div>
                    `).join('') :
                    '<div class="empty-attractions"><p>No attractions selected yet. <a href="#" onclick="editTravelPlan(\'' + planId + '\')">Add some attractions</a> to your plan!</p></div>'
                }
            </div>
            
            ${plan.budget && plan.budget.amount > 0 ? `
                <div class="plan-budget-section">
                    <h3>Budget</h3>
                    <div class="budget-info">
                        <span class="budget-amount">${plan.budget.amount} ${plan.budget.currency || 'USD'}</span>
                        ${plan.travelers > 1 ? `<span class="budget-per-person">(${(plan.budget.amount / plan.travelers).toFixed(2)} per person)</span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${plan.tags && plan.tags.length > 0 ? `
                <div class="plan-tags-section">
                    <h3>Tags</h3>
                    <div class="plan-tags">
                        ${plan.tags.map(tag => `<span class="plan-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${plan.notes ? `
                <div class="plan-notes-section">
                    <h3>Notes</h3>
                    <p>${plan.notes}</p>
                </div>
            ` : ''}
            
            <div class="plan-view-footer">
                <div class="plan-dates">
                    <small>
                        <strong>Created:</strong> ${new Date(plan.createdAt).toLocaleDateString()}
                        ${plan.updatedAt !== plan.createdAt ? ` • <strong>Updated:</strong> ${new Date(plan.updatedAt).toLocaleDateString()}` : ''}
                    </small>
                </div>
            </div>
            
            <div class="plan-view-actions">
                <button class="btn btn-outline" onclick="closeModal('viewPlanModal')">Close</button>
                <button class="btn btn-primary" onclick="editTravelPlan('${planId}')">Edit Plan</button>
                <button class="btn btn-success" onclick="duplicateTravelPlan('${planId}')">Duplicate</button>
           </div>
       `;
       
       openModal('viewPlanModal');
       
   } catch (error) {
       console.error('Failed to load travel plan:', error);
       showToast('Failed to load travel plan: ' + error.message, 'error');
   } finally {
       hideLoading();
   }
}

// Enhanced edit function
async function editTravelPlan(planId) {
   try {
       showLoading();
       const response = await apiRequest(`/travel-plans/${planId}`);
       const plan = response.plan;
       
       if (!plan) {
           throw new Error('Travel plan not found');
       }
       
       // Close view modal
       closeModal('viewPlanModal');
       
       // Pre-populate the create form with existing data
       document.getElementById('planName').value = plan.planName;
       document.getElementById('planDescription').value = plan.description || '';
       document.getElementById('startDate').value = plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '';
       document.getElementById('endDate').value = plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '';
       
       // Set the country
       currentCountry = plan.country;
       selectedAttractions = plan.selectedAttractions || [];
       
       // Load countries and set selection
       await loadCountries();
       
       // Set the country in the dropdown
       setTimeout(() => {
           const countrySelect = document.getElementById('countrySelect');
           for (let option of countrySelect.options) {
               try {
                   const countryData = JSON.parse(option.value);
                   if (countryData.code === plan.country.code) {
                       countrySelect.value = option.value;
                       break;
                   }
               } catch (e) {
                   // Skip invalid options
               }
           }
       }, 100);
       
       // Open the modal in edit mode
       openModal('createPlanModal');
       
       // Go directly to step 2 if there are attractions
       if (selectedAttractions.length > 0) {
           goToStep2();
           updateSelectedAttractionsList();
       }
       
       showToast('Plan loaded for editing', 'info');
       
   } catch (error) {
       console.error('Failed to load plan for editing:', error);
       showToast('Failed to load plan for editing: ' + error.message, 'error');
   } finally {
       hideLoading();
   }
}

// New function to duplicate a travel plan
async function duplicateTravelPlan(planId) {
   try {
       showLoading();
       const response = await apiRequest(`/travel-plans/${planId}`);
       const plan = response.plan;
       
       if (!plan) {
           throw new Error('Travel plan not found');
       }
       
       // Create a copy with modified name
       const duplicatedPlan = {
           planName: `Copy of ${plan.planName}`,
           country: plan.country,
           description: plan.description || '',
           selectedAttractions: plan.selectedAttractions || [],
           startDate: null, // Reset dates for new plan
           endDate: null,
           travelers: plan.travelers || 1,
           isPublic: false,
           tags: plan.tags || [],
           notes: plan.notes || ''
       };
       
       await apiRequest('/travel-plans', {
           method: 'POST',
           body: JSON.stringify(duplicatedPlan)
       });
       
       showToast('Travel plan duplicated successfully!', 'success');
       closeModal('viewPlanModal');
       loadTravelPlans();
       
   } catch (error) {
       console.error('Failed to duplicate travel plan:', error);
       showToast('Failed to duplicate travel plan: ' + error.message, 'error');
   } finally {
       hideLoading();
   }
}

async function deleteTravelPlan(planId) {
   if (!confirm('Are you sure you want to delete this travel plan?')) return;
   
   try {
       showLoading();
       await apiRequest(`/travel-plans/${planId}`, {
           method: 'DELETE'
       });
       showToast('Travel plan deleted successfully!', 'success');
       loadTravelPlans();
   } catch (error) {
       console.error('Failed to delete travel plan:', error);
       showToast('Failed to delete travel plan', 'error');
   } finally {
       hideLoading();
   }
}

function updateTravelPlansCount(count) {
   const countElement = document.getElementById('destinationCount');
   if (countElement) {
       countElement.textContent = `${count} travel plan${count !== 1 ? 's' : ''} created`;
   }
}

// Make functions globally available
window.loadTravelPlans = loadTravelPlans;
window.displayTravelPlans = displayTravelPlans;
window.loadCountries = loadCountries;
window.goToStep1 = goToStep1;
window.goToStep2 = goToStep2;
window.loadAttractions = loadAttractions;
window.addToSelection = addToSelection;
window.removeFromSelection = removeFromSelection;
window.viewAttractionDetails = viewAttractionDetails;
window.saveTravelPlan = saveTravelPlan;
window.viewTravelPlan = viewTravelPlan;
window.deleteTravelPlan = deleteTravelPlan;
window.resetPlanCreation = resetPlanCreation;
window.editTravelPlan = editTravelPlan;
window.duplicateTravelPlan = duplicateTravelPlan;
window.showAttractionDetailsModal = showAttractionDetailsModal;
window.closeAttractionDetailsModal = closeAttractionDetailsModal;