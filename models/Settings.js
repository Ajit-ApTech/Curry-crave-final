import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    // Restaurant Information
    restaurantName: {
        type: String,
        default: 'Curry Crave'
    },
    tagline: {
        type: String,
        default: 'Premium Food Delivery'
    },

    // Contact Information
    email: {
        type: String,
        default: 'info@currycrave.com'
    },
    supportEmail: {
        type: String,
        default: 'support@currycrave.com'
    },
    phone: {
        type: String,
        default: '+91 98765 43210'
    },
    alternatePhone: {
        type: String,
        default: '+91 87654 32109'
    },
    whatsappNumber: {
        type: String,
        default: '+919876543210'
    },

    // Address
    address: {
        street: {
            type: String,
            default: '123 Food Street, Culinary District'
        },
        city: {
            type: String,
            default: 'Hyderabad'
        },
        state: {
            type: String,
            default: 'Telangana'
        },
        pincode: {
            type: String,
            default: '500001'
        }
    },

    // Business Hours
    businessHours: {
        weekday: {
            type: String,
            default: 'Mon - Sat: 10:00 AM - 11:00 PM'
        },
        weekend: {
            type: String,
            default: 'Sunday: 11:00 AM - 10:00 PM'
        }
    },

    // Social Media Links
    socialMedia: {
        facebook: {
            type: String,
            default: 'https://facebook.com/currycrave'
        },
        instagram: {
            type: String,
            default: 'https://instagram.com/currycrave'
        },
        twitter: {
            type: String,
            default: 'https://twitter.com/currycrave'
        },
        youtube: {
            type: String,
            default: 'https://youtube.com/currycrave'
        }
    },

    // Delivery Settings
    deliverySettings: {
        minimumOrder: {
            type: Number,
            default: 100
        },
        deliveryFee: {
            type: Number,
            default: 0
        },
        freeDeliveryAbove: {
            type: Number,
            default: 500
        },
        estimatedDeliveryTime: {
            type: String,
            default: '30-45 minutes'
        }
    },

    // Notification Settings
    notifications: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        newOrderAlerts: {
            type: Boolean,
            default: true
        },
        lowStockWarnings: {
            type: Boolean,
            default: false
        }
    },

    // About Section
    aboutSection: {
        image: {
            type: String,
            default: 'assets/images/about-chef.jpg'
        },
        experienceYears: {
            type: String,
            default: '10+'
        },
        experienceText: {
            type: String,
            default: 'Years Experience'
        },
        paragraph1: {
            type: String,
            default: 'At Curry Crave, we believe food is more than sustenance—it\'s an experience. Our master chefs blend traditional recipes with modern techniques to create unforgettable culinary masterpieces.'
        },
        paragraph2: {
            type: String,
            default: 'With over a decade of excellence, we\'ve served thousands of satisfied customers, earning their trust through quality, authenticity, and exceptional service.'
        },
        features: {
            feature1: {
                type: String,
                default: 'Fresh Ingredients'
            },
            feature2: {
                type: String,
                default: 'Expert Chefs'
            },
            feature3: {
                type: String,
                default: 'Fast Delivery'
            },
            feature4: {
                type: String,
                default: 'Premium Quality'
            }
        }
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

export default mongoose.model('Settings', settingsSchema);
