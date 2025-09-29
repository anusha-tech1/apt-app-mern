import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email"]
    },
    role: {
        type: String,
        required: [true, "Role is required"],
        enum: {
            values: ["admin", "committee_member", "resident", "staff"],
            message: "Role must be one of: admin, committee_member, resident, staff"
        },
        default: "resident"
    },
    // Optional granular permissions primarily for committee members (but can be used for others)
    // Example values: 'member_management', 'announcements', 'reports'
    permissions: {
        type: [String],
        default: [],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false,
        minlength: [8, "Password must be at least 8 characters long"]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // This will automatically handle createdAt and updatedAt
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

export const User = mongoose.model("User", userSchema);